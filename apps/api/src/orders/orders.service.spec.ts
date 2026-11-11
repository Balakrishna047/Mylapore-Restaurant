describe('Mylapore Express Business Rules & State Machine', () => {
  const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
    PENDING_PAYMENT: ['PAID', 'CANCELLED'],
    PAID: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['ACCEPTED', 'CANCELLED'],
    ACCEPTED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY'],
    READY: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: ['COMPLETED'],
    CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
    REFUND_PENDING: ['REFUNDED'],
    REFUNDED: [],
    COMPLETED: []
  };

  function canTransition(current: string, next: string): boolean {
    const allowed = ALLOWED_STATUS_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  function calculateCancellationRefund(status: string, total: number): { refundable: boolean; refundAmount: number; rate: number } {
    if (['PENDING_PAYMENT', 'PAID', 'CONFIRMED'].includes(status)) {
      return { refundable: true, refundAmount: total, rate: 1.0 }; // 100%
    }
    if (status === 'ACCEPTED') {
      return { refundable: true, refundAmount: Number((total * 0.5).toFixed(2)), rate: 0.5 }; // 50%
    }
    return { refundable: false, refundAmount: 0.0, rate: 0.0 }; // 0%
  }

  function calculateServerQuote(subtotal: number, discount: number, orderType: string, tip: number) {
    const taxRate = 0.0825; // 8.25%
    const standardDeliveryFee = 4.99;
    const freeDeliveryThreshold = 45.00;

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const tax = Number((discountedSubtotal * taxRate).toFixed(2));
    const deliveryFee = orderType === 'DELIVERY' ? (subtotal >= freeDeliveryThreshold ? 0.0 : standardDeliveryFee) : 0.0;
    const total = Number((discountedSubtotal + tax + deliveryFee + tip).toFixed(2));

    return { subtotal, discount, tax, deliveryFee, tip, total };
  }

  describe('Order State Machine', () => {
    it('should permit valid linear progression: CONFIRMED -> ACCEPTED -> PREPARING -> READY', () => {
      expect(canTransition('CONFIRMED', 'ACCEPTED')).toBe(true);
      expect(canTransition('ACCEPTED', 'PREPARING')).toBe(true);
      expect(canTransition('PREPARING', 'READY')).toBe(true);
      expect(canTransition('READY', 'OUT_FOR_DELIVERY')).toBe(true);
      expect(canTransition('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);
      expect(canTransition('DELIVERED', 'COMPLETED')).toBe(true);
    });

    it('should reject prohibited backwards transitions (e.g. READY -> PREPARING)', () => {
      expect(canTransition('READY', 'PREPARING')).toBe(false);
      expect(canTransition('DELIVERED', 'READY')).toBe(false);
      expect(canTransition('COMPLETED', 'CONFIRMED')).toBe(false);
    });
  });

  describe('Cancellation & Refund Policy', () => {
    it('should grant 100% refund when order is CONFIRMED (prior to kitchen prep)', () => {
      const result = calculateCancellationRefund('CONFIRMED', 40.00);
      expect(result.refundable).toBe(true);
      expect(result.refundAmount).toBe(40.00);
      expect(result.rate).toBe(1.0);
    });

    it('should grant 50% refund when order is in ACCEPTED stage', () => {
      const result = calculateCancellationRefund('ACCEPTED', 40.00);
      expect(result.refundable).toBe(true);
      expect(result.refundAmount).toBe(20.00);
      expect(result.rate).toBe(0.5);
    });

    it('should prohibit refunds once food has reached PREPARING (blast-chilling/cooking begun)', () => {
      const result = calculateCancellationRefund('PREPARING', 40.00);
      expect(result.refundable).toBe(false);
      expect(result.refundAmount).toBe(0.00);
    });
  });

  describe('Server-Side Pricing Engine', () => {
    it('should accurately calculate sales tax (8.25%) and delivery fee under $45', () => {
      const quote = calculateServerQuote(30.00, 0, 'DELIVERY', 3.00);
      expect(quote.subtotal).toBe(30.00);
      expect(quote.tax).toBe(2.48); // 30.00 * 0.0825 = 2.475 -> 2.48
      expect(quote.deliveryFee).toBe(4.99);
      expect(quote.tip).toBe(3.00);
      expect(quote.total).toBe(40.47);
    });

    it('should waive delivery fee when subtotal >= $45 (Free Delivery Threshold)', () => {
      const quote = calculateServerQuote(50.00, 5.00, 'DELIVERY', 5.00);
      expect(quote.deliveryFee).toBe(0.0);
      expect(quote.total).toBe(53.71); // (45.00 * 1.0825) + 5.00 tip = 48.7125 + 5.00 = 53.71
    });

    it('should apply $0 delivery fee for PICKUP orders regardless of subtotal', () => {
      const quote = calculateServerQuote(20.00, 0, 'PICKUP', 0.00);
      expect(quote.deliveryFee).toBe(0.0);
      expect(quote.total).toBe(21.65);
    });
  });
});
