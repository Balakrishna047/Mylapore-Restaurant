import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CategoryButton {
  id: string;
  name: string;
  slug: string;
  icon: string;
  itemCount: number;
  actionPayload: {
    type: 'FILTER_CATEGORY';
    categorySlug: string;
    categoryName: string;
  };
}

export interface MenuItemCardData {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  priceFormatted: string;
  priceMinor: number;
  currency: string;
  categoryName: string;
  dietaryTags: string[];
  spiceLevel: string;
  isBlastChilled: boolean;
  orderCountBadge?: string;
  actionPayload: {
    type: 'VIEW_ITEM_DETAIL';
    itemId: string;
    itemSlug: string;
  };
}

export interface MenuItemDetailData {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  priceFormatted: string;
  priceMinor: number;
  currency: string;
  categoryName: string;
  dietaryTags: string[];
  spiceLevel: string;
  allergens: string[];
  ingredients: string[];
  nutritionServing: string;
  reheatingInstructions: string;
  isBlastChilled: boolean;
}

@Injectable()
export class DisplayBlockService {
  constructor(private prisma: PrismaService) {}

  formatPrice(basePrice: number): { priceFormatted: string; priceMinor: number } {
    const priceMinor = Math.round(basePrice * 100);
    const priceFormatted = `$${(priceMinor / 100).toFixed(2)}`;
    return { priceFormatted, priceMinor };
  }

  parseArrayString(value?: string | null): string[] {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  buildCategoryButtonsBlock(categories: any[]): { type: string; payload: { categories: CategoryButton[] } } {
    const buttons: CategoryButton[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '🍛',
      itemCount: cat._count?.menuItems ?? cat.menuItems?.length ?? 0,
      actionPayload: {
        type: 'FILTER_CATEGORY',
        categorySlug: cat.slug,
        categoryName: cat.name
      }
    }));

    return {
      type: 'category_buttons',
      payload: { categories: buttons }
    };
  }

  buildMenuItemListBlock(items: any[]): { type: string; payload: { items: MenuItemCardData[]; count: number } } {
    const cardItems: MenuItemCardData[] = items.map((item) => {
      const { priceFormatted, priceMinor } = this.formatPrice(item.basePrice);
      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        imageUrl: item.image,
        priceFormatted,
        priceMinor,
        currency: 'USD',
        categoryName: item.category?.name || 'Mylapore Specials',
        dietaryTags: this.parseArrayString(item.dietaryTags),
        spiceLevel: item.spiceLevel || 'MEDIUM',
        isBlastChilled: item.isBlastChilled ?? true,
        orderCountBadge: item.orderCountBadge || undefined,
        actionPayload: {
          type: 'VIEW_ITEM_DETAIL',
          itemId: item.id,
          itemSlug: item.slug
        }
      };
    });

    return {
      type: 'menu_item_list',
      payload: {
        items: cardItems,
        count: cardItems.length
      }
    };
  }

  buildMenuItemDetailBlock(item: any): { type: string; payload: MenuItemDetailData } {
    const { priceFormatted, priceMinor } = this.formatPrice(item.basePrice);
    return {
      type: 'menu_item_detail',
      payload: {
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        imageUrl: item.image,
        priceFormatted,
        priceMinor,
        currency: 'USD',
        categoryName: item.category?.name || 'Mylapore Specials',
        dietaryTags: this.parseArrayString(item.dietaryTags),
        spiceLevel: item.spiceLevel || 'MEDIUM',
        allergens: this.parseArrayString(item.allergens),
        ingredients: this.parseArrayString(item.ingredients),
        nutritionServing: item.nutritionServing || '1 serving',
        reheatingInstructions:
          item.reheatingInstructions ||
          'Refrigerate at <=40°F (4°C). Reheat thoroughly to 165°F before consuming.',
        isBlastChilled: item.isBlastChilled ?? true
      }
    };
  }

  async persistDisplayBlocks(
    sessionId: string,
    turnId: string,
    requestId: string,
    blocks: Array<{ type: string; payload: any }>
  ) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL

    const createdBlocks = [];
    for (const block of blocks) {
      const record = await this.prisma.chatDisplayBlock.create({
        data: {
          sessionId,
          turnId,
          requestId,
          catalogVersion: 'v1.0.0-pilot',
          type: block.type,
          payload: JSON.stringify(block.payload),
          expiresAt
        }
      });
      createdBlocks.push({
        id: record.id,
        turnId: record.turnId,
        requestId: record.requestId,
        catalogVersion: record.catalogVersion,
        type: record.type,
        payload: block.payload,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt
      });
    }

    return createdBlocks;
  }
}
