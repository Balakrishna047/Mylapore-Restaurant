import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getCategories() {
    return this.prisma.menuCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    });
  }

  async getItems(params: {
    categorySlug?: string;
    dietary?: string; // e.g. "JAIN", "VEGAN"
    spiceLevel?: string;
    search?: string;
    availableOnly?: boolean;
  }) {
    const where: any = {};

    if (params.categorySlug && params.categorySlug !== 'all') {
      const category = await this.prisma.menuCategory.findUnique({
        where: { slug: params.categorySlug }
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    if (params.availableOnly) {
      where.isAvailable = true;
    }

    if (params.spiceLevel) {
      where.spiceLevel = params.spiceLevel.toUpperCase();
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { description: { contains: params.search } }
      ];
    }

    const items = await this.prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        variants: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Format serialized JSON arrays
    let mapped = items.map((item) => this.formatItem(item));

    if (params.dietary) {
      const filterTag = params.dietary.toUpperCase();
      mapped = mapped.filter((item) => item.dietaryTags.includes(filterTag));
    }

    return mapped;
  }

  async getItemByIdOrSlug(idOrSlug: string) {
    let item = await this.prisma.menuItem.findUnique({
      where: { slug: idOrSlug },
      include: {
        category: true,
        variants: true
      }
    });

    if (!item) {
      item = await this.prisma.menuItem.findUnique({
        where: { id: idOrSlug },
        include: {
          category: true,
          variants: true
        }
      });
    }

    if (!item) {
      throw new NotFoundException(`Menu item not found: ${idOrSlug}`);
    }

    return this.formatItem(item);
  }

  private formatItem(item: any) {
    let dietaryTags = [];
    let allergens = [];
    let ingredients = [];

    try {
      dietaryTags = typeof item.dietaryTags === 'string' ? JSON.parse(item.dietaryTags) : item.dietaryTags;
    } catch {
      dietaryTags = [];
    }

    try {
      allergens = typeof item.allergens === 'string' ? JSON.parse(item.allergens) : item.allergens;
    } catch {
      allergens = [];
    }

    try {
      ingredients = typeof item.ingredients === 'string' ? JSON.parse(item.ingredients) : item.ingredients;
    } catch {
      ingredients = [];
    }

    return {
      ...item,
      categoryName: item.category?.name,
      dietaryTags,
      allergens,
      ingredients
    };
  }
}
