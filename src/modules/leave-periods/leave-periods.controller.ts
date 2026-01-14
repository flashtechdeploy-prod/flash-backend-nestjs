import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeavePeriodsService } from './leave-periods.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Leave Periods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leave-periods')
export class LeavePeriodsController {
  constructor(private readonly service: LeavePeriodsService) {}

  @Get()
  @ApiOperation({ summary: 'List leave periods' })
  async findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create leave period' })
  async create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get leave period alerts' })
  async getAlerts(@Query() query: any) {
    return this.service.getAlerts(query);
  }

  @Put(':leave_period_id')
  @ApiOperation({ summary: 'Update leave period' })
  async update(
    @Param('leave_period_id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':leave_period_id')
  @ApiOperation({ summary: 'Delete leave period' })
  async remove(@Param('leave_period_id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
