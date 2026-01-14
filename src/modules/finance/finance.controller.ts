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
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'List accounts' })
  async listAccounts() {
    return this.service.listAccounts();
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create account' })
  async createAccount(@Body() dto: any) {
    return this.service.createAccount(dto);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account' })
  async getAccount(@Param('id', ParseIntPipe) id: number) {
    return this.service.getAccount(id);
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: 'Update account' })
  async updateAccount(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.service.updateAccount(id, dto);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Delete account' })
  async deleteAccount(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteAccount(id);
  }

  @Get('journal-entries')
  @ApiOperation({ summary: 'List journal entries' })
  async listJournalEntries() {
    return this.service.listJournalEntries();
  }

  @Post('journal-entries')
  @ApiOperation({ summary: 'Create journal entry' })
  async createJournalEntry(@Body() dto: any) {
    return this.service.createJournalEntry(dto);
  }

  @Get('journal-entries/:id')
  @ApiOperation({ summary: 'Get journal entry' })
  async getJournalEntry(@Param('id', ParseIntPipe) id: number) {
    return this.service.getJournalEntry(id);
  }

  @Put('journal-entries/:id')
  @ApiOperation({ summary: 'Update journal entry' })
  async updateJournalEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.updateJournalEntry(id, dto);
  }

  @Delete('journal-entries/:id')
  @ApiOperation({ summary: 'Delete journal entry' })
  async deleteJournalEntry(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteJournalEntry(id);
  }

  @Post('journal-entries/:id/post')
  @ApiOperation({ summary: 'Post journal entry' })
  async postJournalEntry(@Param('id', ParseIntPipe) id: number) {
    return this.service.postJournalEntry(id);
  }
}

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly service: FinanceService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses' })
  async listExpenses(@Query() query: any) {
    return this.service.listExpenses(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create expense' })
  async createExpense(@Body() dto: any) {
    return this.service.createExpense(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense' })
  async getExpense(@Param('id', ParseIntPipe) id: number) {
    return this.service.getExpense(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update expense' })
  async updateExpense(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.service.updateExpense(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense' })
  async deleteExpense(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteExpense(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve expense' })
  async approveExpense(@Param('id', ParseIntPipe) id: number) {
    return this.service.approveExpense(id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Mark expense as paid' })
  async payExpense(@Param('id', ParseIntPipe) id: number) {
    return this.service.payExpense(id);
  }

  @Post(':id/undo-payment')
  @ApiOperation({ summary: 'Undo expense payment' })
  async undoPayment(@Param('id', ParseIntPipe) id: number) {
    return this.service.undoPayment(id);
  }

  @Get('summary/monthly')
  @ApiOperation({ summary: 'Get monthly expenses summary' })
  async getMonthlySummary(@Query('month') month: string) {
    return this.service.getMonthlyExpensesSummary(month);
  }
}
