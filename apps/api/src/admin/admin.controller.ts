import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@ApiTags('Admin Operations & KDS')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'KITCHEN_MANAGER')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get kitchen queue, order volume, revenue & KDS tickets' })
  async getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  @Patch('inventory/:itemId/toggle')
  @ApiOperation({ summary: 'Toggle dish 86 (out-of-stock) or restock' })
  async toggleStock(@Param('itemId') itemId: string) {
    return this.adminService.toggleDishStock(itemId);
  }

  @Post('menu/items')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'KITCHEN_MANAGER')
  @ApiOperation({ summary: 'Create a new menu dish item with pricing, image, and dietary tags' })
  async createMenuItem(@Body() body: any) {
    return this.adminService.createMenuItem(body);
  }

  @Patch('menu/items/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'KITCHEN_MANAGER')
  @ApiOperation({ summary: 'Update dish price, image, name, dietary tags, spice level, or details' })
  async updateMenuItem(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateMenuItem(id, body);
  }

  @Delete('menu/items/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN')
  @ApiOperation({ summary: 'Delete or archive a menu dish item' })
  async deleteMenuItem(@Param('id') id: string) {
    return this.adminService.deleteMenuItem(id);
  }

  @Get('audit-logs')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'View immutable system audit logs' })
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
