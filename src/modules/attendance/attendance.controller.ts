import { Controller, Get, Put, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get()
  @ApiOperation({ summary: 'List attendance for a date' })
  @ApiQuery({ name: 'date', required: true })
  async findByDate(@Query('date') date: string) {
    return this.service.findByDate(date);
  }

  @Put()
  @ApiOperation({ summary: 'Bulk upsert attendance' })
  async bulkUpsert(@Body() body: { date: string; records: any[] }) {
    return this.service.bulkUpsert(body.date, body.records);
  }

  @Get('range')
  @ApiOperation({ summary: 'List attendance for date range' })
  @ApiQuery({ name: 'from_date', required: true })
  @ApiQuery({ name: 'to_date', required: true })
  async findByRange(
    @Query('from_date') from_date: string,
    @Query('to_date') to_date: string,
  ) {
    return this.service.findByRange(from_date, to_date);
  }

  @Get('employee/:employee_id')
  @ApiOperation({ summary: 'Get employee attendance for range' })
  @ApiQuery({ name: 'from_date', required: true })
  @ApiQuery({ name: 'to_date', required: true })
  async findByEmployee(
    @Param('employee_id') employee_id: string,
    @Query('from_date') from_date: string,
    @Query('to_date') to_date: string,
  ) {
    return this.service.findByEmployee(employee_id, from_date, to_date);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get attendance summary' })
  @ApiQuery({ name: 'from_date', required: true })
  @ApiQuery({ name: 'to_date', required: true })
  async getSummary(
    @Query('from_date') from_date: string,
    @Query('to_date') to_date: string,
    @Query('department') department?: string,
    @Query('designation') designation?: string,
  ) {
    return this.service.getSummary(from_date, to_date, { department, designation });
  }
}
