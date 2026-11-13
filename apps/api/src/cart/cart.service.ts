import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId?: string, sessionToken?: string) {
    if (!userId && !sessionToken) {
      throw new BadRequestException('Either userId or sessionToken must be provided');
    }

    let cart = null;
    if (userId) {
      cart = await this.prisma.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: {
              menuItem: {
                include: { variants: true }
              }
            }
          }
        }
      });
    } else if (sessionToken) {
      cart = await this.prisma.cart.findUnique({
        where: { sessionToken },
        include: {
          items: {
            include: {
              menuItem: {
                include: { variants: true }
              }
            }
          }
        }
      });
    }

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId: userId || null,
          sessionToken: sessionToken || null
        },
        include: {
          items: {
            include: {
              menuItem: {
                include: { variants: true }
              }
            }
          }
        }
      });
    }

    return this.formatCart(cart);
  }

  async addItem(params: {
    userId?: string;
    sessionToken?: string;
    menuItemId: string;
    quantity: number;
    variantId?: string;
    spiceLevel?: string;
    specialInstructions?: string;
  }) {
    const cart = await this.getOrCreateCart(params.userId, params.sessionToken);

    // Resilient lookup: match by primary key UUID OR by permanent dish slug
    const menuItem = await this.prisma.menuItem.findFirst({
      where: {
        OR: [
          { id: params.menuItemId },
          { slug: params.menuItemId }
        ]
      },
      include: { variants: true }
    });

    if (!menuItem || !menuItem.isAvailable) {
      throw new BadRequestException('This dish is currently unavailable');
    }

    let unitPrice = menuItem.basePrice;
    if (params.variantId) {
      const variant = menuItem.variants.find((v) => v.id === params.variantId);
      if (variant) {
        unitPrice = variant.price;
      }
    }

    // Check if duplicate item exists in cart using canonical menuItem.id
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        menuItemId: menuItem.id,
        variantId: params.variantId || null,
        spiceLevel: params.spiceLevel || null
      }
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + params.quantity,
          unitPrice // Always refresh price from database
        }
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId: menuItem.id,
          quantity: params.quantity,
          unitPrice,
          variantId: params.variantId || null,
          spiceLevel: params.spiceLevel || null,
          specialInstructions: params.specialInstructions || null
        }
      });
    }

    return this.getOrCreateCart(params.userId, params.sessionToken);
  }

  async updateItemQuantity(itemId: string, quantity: number, userId?: string, sessionToken?: string) {
    if (quantity <= 0) {
      await this.prisma.cartItem.deleteMany({
        where: { id: itemId }
      });
    } else {
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity }
      });
    }
    return this.getOrCreateCart(userId, sessionToken);
  }

  async removeItem(itemId: string, userId?: string, sessionToken?: string) {
    await this.prisma.cartItem.deleteMany({
      where: { id: itemId }
    });
    return this.getOrCreateCart(userId, sessionToken);
  }

  async mergeGuestCart(guestSessionToken: string, userId: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { sessionToken: guestSessionToken },
      include: { items: true }
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCart(userId);
    }

    const userCart = await this.getOrCreateCart(userId);

    for (const item of guestCart.items) {
      const existing = await this.prisma.cartItem.findFirst({
        where: {
          cartId: userCart.id,
          menuItemId: item.menuItemId,
          variantId: item.variantId,
          spiceLevel: item.spiceLevel
        }
      });

      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity }
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            variantId: item.variantId,
            spiceLevel: item.spiceLevel,
            specialInstructions: item.specialInstructions
          }
        });
      }
    }

    // Delete guest cart after merge
    await this.prisma.cart.delete({ where: { id: guestCart.id } });

    return this.getOrCreateCart(userId);
  }

  private formatCart(cart: any) {
    const items = (cart.items || []).map((ci: any) => {
      const totalPrice = Number((ci.quantity * ci.unitPrice).toFixed(2));
      let variantName = undefined;
      if (ci.variantId && ci.menuItem?.variants) {
        const v = ci.menuItem.variants.find((v: any) => v.id === ci.variantId);
        if (v) variantName = v.name;
      }
      return {
        id: ci.id,
        menuItemId: ci.menuItemId,
        name: ci.menuItem?.name || 'Dish',
        image: ci.menuItem?.image || '',
        quantity: ci.quantity,
        unitPrice: ci.unitPrice,
        totalPrice,
        variantId: ci.variantId,
        variantName,
        spiceLevel: ci.spiceLevel,
        specialInstructions: ci.specialInstructions,
        isBlastChilled: ci.menuItem?.isBlastChilled ?? true
      };
    });

    const subtotal = Number(items.reduce((acc: number, item: any) => acc + item.totalPrice, 0).toFixed(2));
    const itemCount = items.reduce((acc: number, item: any) => acc + item.quantity, 0);

    return {
      id: cart.id,
      items,
      subtotal,
      itemCount
    };
  }
}
