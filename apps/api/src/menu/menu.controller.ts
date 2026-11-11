import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MenuService } from './menu.service';

@ApiTags('Menu & Catalog')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List all menu categories with icons and counts' })
  async getCategories() {
    return this.menuService.getCategories();
  }

  @Get('items')
  @ApiOperation({ summary: 'Get filtered dishes by category, dietary preferences, or spice' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'dietary', required: false })
  @ApiQuery({ name: 'spiceLevel', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getItems(
    @Query('category') category?: string,
    @Query('dietary') dietary?: string,
    @Query('spiceLevel') spiceLevel?: string,
    @Query('search') search?: string
  ) {
    return this.menuService.getItems({
      categorySlug: category,
      dietary,
      spiceLevel,
      search,
      availableOnly: true
    });
  }

  @Get('items/:idOrSlug')
  @ApiOperation({ summary: 'Get detailed item specification including allergens, nutrition & variants' })
  async getItemDetails(@Param('idOrSlug') idOrSlug: string) {
    return this.menuService.getItemByIdOrSlug(idOrSlug);
  }
}
