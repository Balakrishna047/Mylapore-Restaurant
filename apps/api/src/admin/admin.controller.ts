import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
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

  @Get('audit-logs')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'View immutable system audit logs' })
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
