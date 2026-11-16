import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics() {
    const orders = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    const totalOrders = orders.length;
    const confirmedOrders = orders.filter((o) => ['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(o.status));
    const gmv = confirmedOrders.reduce((sum, o) => sum + o.total, 0);

    const activeKitchenQueue = orders.filter((o) =>
      ['CONFIRMED', 'ACCEPTED', 'PREPARING'].includes(o.status)
    );

    const readyForDeliveryQueue = orders.filter((o) =>
      ['READY', 'OUT_FOR_DELIVERY'].includes(o.status)
    );

    const recentOrders = orders.slice(0, 10).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.guestName,
      customerPhone: o.guestPhone,
      status: o.status,
      total: o.total,
      deliverySlot: o.deliverySlot,
      createdAt: o.createdAt,
      itemsCount: o.items.reduce((acc, i) => acc + i.quantity, 0)
    }));

    const totalCustomers = await this.prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalMenuItems = await this.prisma.menuItem.count();
    const outOfStockItems = await this.prisma.menuItem.count({ where: { isAvailable: false } });

    return {
      totalRevenue: Number(gmv.toFixed(2)),
      totalOrders,
      activeKitchenCount: activeKitchenQueue.length,
      readyDeliveryCount: readyForDeliveryQueue.length,
      totalCustomers,
      totalMenuItems,
      outOfStockItems,
      recentOrders,
      activeKitchenOrders: activeKitchenQueue.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        customerName: o.guestName,
        deliverySlot: o.deliverySlot,
        items: o.items.map((i) => `${i.quantity}x ${i.name} (${i.optionsSummary || 'Standard'})`),
        notes: o.notes,
        createdAt: o.createdAt
      }))
    };
  }

  async toggleDishStock(itemId: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Dish not found');

    const updated = await this.prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: !item.isAvailable }
    });

    await this.prisma.auditLog.create({
      data: {
        action: updated.isAvailable ? 'RESTOCKED_ITEM' : '86_ITEM_OUT_OF_STOCK',
        entity: 'MenuItem',
        entityId: item.id,
        payload: JSON.stringify({ name: item.name, isAvailable: updated.isAvailable })
      }
    });

    return updated;
  }

  async createMenuItem(data: {
    name: string;
    description: string;
    categoryId: string;
    basePrice: number;
    image: string;
    spiceLevel?: string;
    dietaryTags?: string[] | string;
    allergens?: string[] | string;
    ingredients?: string[] | string;
    isBlastChilled?: boolean;
    nutritionServing?: string;
    reheatingInstructions?: string;
  }) {
    if (!data.name || !data.categoryId || data.basePrice === undefined || !data.image) {
      throw new Error('Name, categoryId, basePrice, and image are required');
    }

    let slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existingSlug = await this.prisma.menuItem.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const dietaryTags = Array.isArray(data.dietaryTags)
      ? JSON.stringify(data.dietaryTags)
      : typeof data.dietaryTags === 'string'
      ? data.dietaryTags
      : JSON.stringify(['VEGETARIAN']);

    const allergens = Array.isArray(data.allergens)
      ? JSON.stringify(data.allergens)
      : typeof data.allergens === 'string'
      ? data.allergens
      : JSON.stringify([]);

    const ingredients = Array.isArray(data.ingredients)
      ? JSON.stringify(data.ingredients)
      : typeof data.ingredients === 'string'
      ? data.ingredients
      : JSON.stringify([]);

    const created = await this.prisma.menuItem.create({
      data: {
        slug,
        name: data.name,
        description: data.description || `${data.name} prepared freshly with authentic South Indian ingredients.`,
        categoryId: data.categoryId,
        basePrice: parseFloat(data.basePrice as any),
        image: data.image,
        spiceLevel: (data.spiceLevel || 'MEDIUM').toUpperCase(),
        dietaryTags,
        allergens,
        ingredients,
        isBlastChilled: data.isBlastChilled ?? true,
        nutritionServing: data.nutritionServing || '1 serving',
        reheatingInstructions: data.reheatingInstructions || 'Refrigerate at <=40°F (4°C). Reheat thoroughly before consuming.',
        orderCountBadge: '100+ ordered',
        rating: 5.0,
        reviewCount: 15,
        isAvailable: true
      },
      include: { category: true }
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'CREATED_MENU_ITEM',
        entity: 'MenuItem',
        entityId: created.id,
        payload: JSON.stringify({ name: created.name, basePrice: created.basePrice, slug: created.slug })
      }
    });

    return created;
  }

  async updateMenuItem(
    itemId: string,
    data: {
      name?: string;
      description?: string;
      categoryId?: string;
      basePrice?: number;
      image?: string;
      spiceLevel?: string;
      dietaryTags?: string[] | string;
      allergens?: string[] | string;
      ingredients?: string[] | string;
      isBlastChilled?: boolean;
      nutritionServing?: string;
      reheatingInstructions?: string;
      isAvailable?: boolean;
    }
  ) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Dish not found');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.basePrice !== undefined) updateData.basePrice = parseFloat(data.basePrice as any);
    if (data.image !== undefined) updateData.image = data.image;
    if (data.spiceLevel !== undefined) updateData.spiceLevel = data.spiceLevel.toUpperCase();
    if (data.isBlastChilled !== undefined) updateData.isBlastChilled = data.isBlastChilled;
    if (data.nutritionServing !== undefined) updateData.nutritionServing = data.nutritionServing;
    if (data.reheatingInstructions !== undefined) updateData.reheatingInstructions = data.reheatingInstructions;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;

    if (data.dietaryTags !== undefined) {
      updateData.dietaryTags = Array.isArray(data.dietaryTags)
        ? JSON.stringify(data.dietaryTags)
        : data.dietaryTags;
    }
    if (data.allergens !== undefined) {
      updateData.allergens = Array.isArray(data.allergens)
        ? JSON.stringify(data.allergens)
        : data.allergens;
    }
    if (data.ingredients !== undefined) {
      updateData.ingredients = Array.isArray(data.ingredients)
        ? JSON.stringify(data.ingredients)
        : data.ingredients;
    }

    const updated = await this.prisma.menuItem.update({
      where: { id: itemId },
      data: updateData,
      include: { category: true }
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATED_MENU_ITEM',
        entity: 'MenuItem',
        entityId: item.id,
        payload: JSON.stringify({
          previousPrice: item.basePrice,
          newPrice: updated.basePrice,
          name: updated.name,
          updatedFields: Object.keys(updateData)
        })
      }
    });

    return updated;
  }

  async deleteMenuItem(itemId: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Dish not found');

    const ordersCount = await this.prisma.orderItem.count({ where: { menuItemId: itemId } });
    if (ordersCount > 0) {
      // Dish is referenced in order history: archive safely
      const archived = await this.prisma.menuItem.update({
        where: { id: itemId },
        data: { isAvailable: false }
      });
      await this.prisma.auditLog.create({
        data: {
          action: 'ARCHIVED_MENU_ITEM',
          entity: 'MenuItem',
          entityId: itemId,
          payload: JSON.stringify({ reason: 'Referenced in orders, marked out-of-stock' })
        }
      });
      return { success: true, action: 'ARCHIVED', item: archived, message: 'Dish archived and marked unavailable to preserve customer order history.' };
    }

    await this.prisma.menuItem.delete({ where: { id: itemId } });
    await this.prisma.auditLog.create({
      data: {
        action: 'DELETED_MENU_ITEM',
        entity: 'MenuItem',
        entityId: itemId,
        payload: JSON.stringify({ name: item.name })
      }
    });

    return { success: true, action: 'DELETED', message: 'Dish deleted successfully from menu.' };
  }

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }
}
