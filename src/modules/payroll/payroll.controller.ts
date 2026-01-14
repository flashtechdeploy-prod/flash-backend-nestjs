import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Get('payment-status')
  @ApiOperation({ summary: 'Get payment status' })
  @ApiQuery({ name: 'month', required: true })
  @ApiQuery({ name: 'employee_id', required: true })
  async getPaymentStatus(
    @Query('month') month: string,
    @Query('employee_id') employee_id: string,
  ) {
    return this.service.getPaymentStatus(month, employee_id);
  }

  @Put('payment-status')
  @ApiOperation({ summary: 'Upsert payment status' })
  async upsertPaymentStatus(@Body() dto: any) {
    return this.service.upsertPaymentStatus(dto);
  }

  @Get('report')
  @ApiOperation({ summary: 'Get payroll report' })
  @ApiQuery({ name: 'month', required: true })
  async getReport(@Query('month') month: string) {
    return this.service.getReport(month);
  }

  @Get('range-report')
  @ApiOperation({ summary: 'Get payroll range report' })
  @ApiQuery({ name: 'from_date', required: true })
  @ApiQuery({ name: 'to_date', required: true })
  @ApiQuery({ name: 'month', required: false })
  async getRangeReport(
    @Query('from_date') from_date: string,
    @Query('to_date') to_date: string,
    @Query('month') month?: string,
  ) {
    return this.service.getRangeReport(from_date, to_date, month);
  }

  @Get('sheet-entries')
  @ApiOperation({ summary: 'List payroll sheet entries' })
  @ApiQuery({ name: 'from_date', required: true })
  @ApiQuery({ name: 'to_date', required: true })
  async listSheetEntries(
    @Query('from_date') from_date: string,
    @Query('to_date') to_date: string,
  ) {
    return this.service.listSheetEntries(from_date, to_date);
  }

  @Put('sheet-entries')
  @ApiOperation({ summary: 'Bulk upsert payroll sheet entries' })
  async bulkUpsertSheetEntries(@Body() dto: any) {
    return this.service.bulkUpsertSheetEntries(dto);
  }

  @Post('export-pdf')
  @ApiOperation({ summary: 'Export payroll as PDF' })
  async exportPdf(@Query() query: any, @Body() body: any) {
    return this.service.exportPdf(query, body);
  }
}
