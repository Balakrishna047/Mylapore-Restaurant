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

// Mylapore Express v2.7 Agentforce Chatbot Schemas
export const CategoryButtonSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string(),
  itemCount: z.number().int().nonnegative(),
  actionPayload: z.object({
    type: z.literal('FILTER_CATEGORY'),
    categorySlug: z.string(),
    categoryName: z.string()
  })
});

export const MenuItemCardDataSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  priceFormatted: z.string(),
  priceMinor: z.number().int().nonnegative(),
  currency: z.string(),
  categoryName: z.string(),
  dietaryTags: z.array(z.string()),
  spiceLevel: z.string(),
  isBlastChilled: z.boolean(),
  orderCountBadge: z.string().optional(),
  actionPayload: z.object({
    type: z.literal('VIEW_ITEM_DETAIL'),
    itemId: z.string(),
    itemSlug: z.string()
  })
});

export const MenuItemDetailDataSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  priceFormatted: z.string(),
  priceMinor: z.number().int().nonnegative(),
  currency: z.string(),
  categoryName: z.string(),
  dietaryTags: z.array(z.string()),
  spiceLevel: z.string(),
  allergens: z.array(z.string()),
  ingredients: z.array(z.string()),
  nutritionServing: z.string(),
  reheatingInstructions: z.string(),
  isBlastChilled: z.boolean()
});

export const ChatDisplayBlockSchema = z.object({
  id: z.string().optional(),
  turnId: z.string().optional(),
  requestId: z.string().optional(),
  catalogVersion: z.string().optional(),
  type: z.enum(['category_buttons', 'menu_item_list', 'menu_item_detail']),
  payload: z.union([
    z.object({ categories: z.array(CategoryButtonSchema) }),
    z.object({ items: z.array(MenuItemCardDataSchema), count: z.number() }),
    MenuItemDetailDataSchema
  ]),
  createdAt: z.union([z.string(), z.date()]).optional(),
  expiresAt: z.union([z.string(), z.date()]).optional()
});

export const ChatTurnResponseSchema = z.object({
  turnId: z.string(),
  turnNumber: z.number().int().positive(),
  turnToken: z.string(),
  agentText: z.string(),
  displayBlocks: z.array(ChatDisplayBlockSchema)
});

export const ChatSessionResponseSchema = z.object({
  sessionToken: z.string(),
  sessionId: z.string(),
  status: z.string(),
  outletId: z.string(),
  welcomeMessage: z.string(),
  displayBlocks: z.array(ChatDisplayBlockSchema)
});
