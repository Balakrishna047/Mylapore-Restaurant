import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async validateCoupon(code: string, subtotal: number) {
    if (!code) return null;

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() }
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException(`Promo code "${code}" is invalid or expired`);
    }

    if (new Date() > coupon.validUntil) {
      throw new BadRequestException(`Promo code "${code}" has expired`);
    }

    if (subtotal < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Promo code "${code}" requires a minimum order subtotal of $${coupon.minOrderAmount.toFixed(2)}`
      );
    }

    let discount = 0;
    if (coupon.discountPercent && coupon.discountPercent > 0) {
      discount = (subtotal * coupon.discountPercent) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.discountAmount && coupon.discountAmount > 0) {
      discount = coupon.discountAmount;
    }

    discount = Math.min(discount, subtotal);

    return {
      code: coupon.code,
      description: coupon.description,
      discount: Number(discount.toFixed(2))
    };
  }
}
