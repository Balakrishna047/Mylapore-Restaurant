export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RESTAURANT_ADMIN = 'RESTAURANT_ADMIN',
  KITCHEN_MANAGER = 'KITCHEN_MANAGER',
  DELIVERY_MANAGER = 'DELIVERY_MANAGER',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  CUSTOMER = 'CUSTOMER'
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  REQUIRES_PAYMENT_METHOD = 'REQUIRES_PAYMENT_METHOD',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum OrderType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP'
}

export enum DietaryTag {
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
  JAIN = 'JAIN',
  GLUTEN_FREE = 'GLUTEN_FREE',
  NUT_FREE = 'NUT_FREE'
}

export enum SpiceLevel {
  MILD = 'MILD',
  MEDIUM = 'MEDIUM',
  HOT = 'HOT',
  EXTRA_HOT = 'EXTRA_HOT'
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

export interface MenuItemVariant {
  id: string;
  name: string; // e.g. "Regular (16 oz)", "Family (32 oz)"
  price: number; // in USD
  servesCount: number;
}

export interface MenuItemDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  basePrice: number;
  image: string;
  orderCountBadge?: string; // e.g. "1,000+ ordered"
  isBlastChilled: boolean;
  dietaryTags: DietaryTag[];
  spiceLevel: SpiceLevel;
  allergens: string[];
  ingredients: string[];
  nutritionServing: string;
  reheatingInstructions: string;
  isAvailable: boolean;
  variants: MenuItemVariant[];
  rating: number;
  reviewCount: number;
}

export interface MenuCategoryDto {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  itemCount?: number;
}

export interface CartItemOption {
  variantId?: string;
  variantName?: string;
  spiceLevel?: SpiceLevel;
  specialInstructions?: string;
}

export interface CartItemDto {
  id: string;
  menuItemId: string;
  menuItem: MenuItemDto;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedOptions?: CartItemOption;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  subtotal: number;
  itemCount: number;
}

export interface CheckoutQuoteDto {
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  total: number;
  currency: string;
  minimumMet: boolean;
  freeDeliveryThresholdMet: boolean;
}

export interface CreateOrderDto {
  deliveryAddressId?: string;
  deliveryAddressText?: string;
  orderType: OrderType;
  deliverySlot: string; // e.g. "Today, 12:30 PM - 1:30 PM"
  tip?: number;
  couponCode?: string;
  specialInstructions?: string;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
}

export interface OrderItemDto {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  optionsSummary?: string;
}

export interface OrderStatusHistoryDto {
  id: string;
  status: OrderStatus;
  note?: string;
  createdAt: string;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  orderType: OrderType;
  deliveryAddress?: string;
  deliverySlot: string;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  total: number;
  paymentStatus: PaymentStatus;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
  history: OrderStatusHistoryDto[];
  canReschedule: boolean;
  canCancel: boolean;
}

export interface SupportMessageDto {
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  orderReference?: string;
}
