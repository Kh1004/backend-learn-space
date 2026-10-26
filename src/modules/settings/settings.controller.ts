import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import {
  CreateSettingDto,
  UpdateSettingDto,
  SettingResponseDto,
} from './dto';
import { PaginationQueryDto } from '../../common/dtos';
import { Roles, ApiPaginatedResponse } from '../../common/decorators';
import { Role } from '../../common/enums';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all settings (Admin)' })
  @ApiPaginatedResponse(SettingResponseDto)
  findAll(@Query() query: PaginationQueryDto) {
    return this.settingsService.findAll(query);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public settings' })
  @ApiResponse({ status: 200, description: 'Public settings list' })
  findPublic() {
    return this.settingsService.findPublic();
  }

  @Get('category/:category')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get settings by category (Admin)' })
  @ApiParam({ name: 'category', description: 'Setting category' })
  @ApiResponse({ status: 200, description: 'Settings for category' })
  findByCategory(@Param('category') category: string) {
    return this.settingsService.findByCategory(category);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get setting by ID (Admin)' })
  @ApiParam({ name: 'id', description: 'Setting UUID' })
  @ApiResponse({ status: 200, description: 'Setting details' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  findOne(@Param('id') id: string) {
    return this.settingsService.findOne(id);
  }

  @Get('key/:key')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get setting by key (Admin)' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting details' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create setting (Super Admin)' })
  @ApiResponse({ status: 201, description: 'Setting created' })
  @ApiResponse({ status: 409, description: 'Key already exists' })
  create(@Body() dto: CreateSettingDto) {
    return this.settingsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update setting (Super Admin)' })
  @ApiParam({ name: 'id', description: 'Setting UUID' })
  @ApiResponse({ status: 200, description: 'Setting updated' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  update(@Param('id') id: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.update(id, dto);
  }

  @Post('bulk')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bulk upsert settings (Super Admin)' })
  @ApiResponse({ status: 201, description: 'Settings upserted' })
  bulkUpdate(
    @Body()
    body: { settings: Array<{ key: string; value: string; description?: string }> },
  ) {
    return this.settingsService.bulkUpdate(body.settings);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete setting (Super Admin)' })
  @ApiParam({ name: 'id', description: 'Setting UUID' })
  @ApiResponse({ status: 200, description: 'Setting deleted' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  remove(@Param('id') id: string) {
    return this.settingsService.remove(id);
  }

  @Post(':id/restore')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Restore deleted setting (Super Admin)' })
  @ApiParam({ name: 'id', description: 'Setting UUID' })
  @ApiResponse({ status: 200, description: 'Setting restored' })
  @ApiResponse({ status: 404, description: 'Deleted setting not found' })
  restore(@Param('id') id: string) {
    return this.settingsService.restore(id);
  }
}
