import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get('info')
  @ApiOperation({ summary: 'Get restaurant operational status, hours and delivery settings' })
  async getInfo() {
    return this.restaurantsService.getInfo();
  }

  @Patch('info')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update restaurant hours or toggle order acceptance (Staff)' })
  async updateInfo(@Body() body: any) {
    return this.restaurantsService.updateOperatingHours(body);
  }
}
