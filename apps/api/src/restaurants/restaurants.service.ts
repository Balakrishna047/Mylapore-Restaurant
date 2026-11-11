import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async getInfo() {
    const restaurant = await this.prisma.restaurant.findFirst();
    if (!restaurant) {
      throw new NotFoundException('Restaurant configuration not found');
    }
    return restaurant;
  }

  async updateOperatingHours(data: { openingTime?: string; closingTime?: string; isAcceptingOrders?: boolean }) {
    const restaurant = await this.prisma.restaurant.findFirst();
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return this.prisma.restaurant.update({
      where: { id: restaurant.id },
      data
    });
  }
}
