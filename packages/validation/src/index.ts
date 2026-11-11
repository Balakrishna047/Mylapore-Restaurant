import { z } from 'zod';
import { OrderType, SpiceLevel, UserRole } from '@mylapore/shared-types';

export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional()
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const AddToCartSchema = z.object({
  menuItemId: z.string().min(1, 'Menu item ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Max 50 items per order'),
  variantId: z.string().optional(),
  spiceLevel: z.nativeEnum(SpiceLevel).optional(),
  specialInstructions: z.string().max(250).optional()
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative').max(50)
});

export const CheckoutQuoteSchema = z.object({
  orderType: z.nativeEnum(OrderType),
  deliveryAddressText: z.string().optional(),
  couponCode: z.string().optional(),
  tip: z.number().min(0).default(0)
});

export const CreateOrderRequestSchema = z.object({
  orderType: z.nativeEnum(OrderType),
  deliveryAddressText: z.string().optional(),
  deliverySlot: z.string().min(1, 'Delivery slot is required'),
  couponCode: z.string().optional(),
  tip: z.number().min(0).default(0),
  specialInstructions: z.string().max(500).optional(),
  guestEmail: z.string().email().optional(),
  guestName: z.string().min(2).optional(),
  guestPhone: z.string().optional()
});

export const RescheduleOrderSchema = z.object({
  newDeliverySlot: z.string().min(1, 'New delivery slot is required'),
  reason: z.string().max(250).optional()
});

export const CancelOrderSchema = z.object({
  reason: z.string().min(3, 'Please provide a cancellation reason')
});

export const SupportMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000),
  orderNumber: z.string().optional()
});
