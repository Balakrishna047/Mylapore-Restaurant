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

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }
}
