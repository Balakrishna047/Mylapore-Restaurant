import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeliveryService, LocationCheckDto } from './delivery.service';

@ApiTags('Delivery & Geolocation')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('check')
  @ApiOperation({ summary: 'Check delivery eligibility, distance, and available time slots by coordinates or postal code' })
  @ApiResponse({ status: 200, description: 'Delivery eligibility details returned' })
  checkEligibility(@Body() body: LocationCheckDto) {
    return this.deliveryService.checkEligibility(body);
  }

  @Get('zones')
  @ApiOperation({ summary: 'List supported restaurant delivery zones and regional hubs' })
  getDeliveryZones() {
    return this.deliveryService.getDeliveryZones();
  }
}
