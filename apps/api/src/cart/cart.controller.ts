import { Controller, Get, Post, Put, Delete, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { OptionalJwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { AddToCartSchema, UpdateCartItemSchema } from '@mylapore/validation';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get current customer or guest cart' })
  @ApiHeader({ name: 'x-session-token', required: false })
  async getCart(
    @CurrentUser('id') userId?: string,
    @Headers('x-session-token') sessionToken?: string
  ) {
    return this.cartService.getOrCreateCart(userId, sessionToken || 'guest_default');
  }

  @Post('items')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiHeader({ name: 'x-session-token', required: false })
  async addItem(
    @Body() body: any,
    @CurrentUser('id') userId?: string,
    @Headers('x-session-token') sessionToken?: string
  ) {
    const validated = AddToCartSchema.parse(body);
    return this.cartService.addItem({
      userId,
      sessionToken: sessionToken || 'guest_default',
      menuItemId: validated.menuItemId,
      quantity: validated.quantity,
      variantId: validated.variantId,
      spiceLevel: validated.spiceLevel,
      specialInstructions: validated.specialInstructions
    });
  }

  @Put('items/:itemId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateQuantity(
    @Param('itemId') itemId: string,
    @Body() body: any,
    @CurrentUser('id') userId?: string,
    @Headers('x-session-token') sessionToken?: string
  ) {
    const validated = UpdateCartItemSchema.parse(body);
    return this.cartService.updateItemQuantity(itemId, validated.quantity, userId, sessionToken || 'guest_default');
  }

  @Delete('items/:itemId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId?: string,
    @Headers('x-session-token') sessionToken?: string
  ) {
    return this.cartService.removeItem(itemId, userId, sessionToken || 'guest_default');
  }

  @Post('merge')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Merge guest cart into logged-in user cart' })
  async mergeCart(
    @Body('guestSessionToken') guestSessionToken: string,
    @CurrentUser('id') userId: string
  ) {
    return this.cartService.mergeGuestCart(guestSessionToken, userId);
  }
}
