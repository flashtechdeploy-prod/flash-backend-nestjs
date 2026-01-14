import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import * as schema from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, asc, desc, and, between, like, SQL } from 'drizzle-orm';

@Injectable()
export class FinanceService {
  constructor(
    @Inject(DRIZZLE)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async listAccounts() {
    return this.db
      .select()
      .from(schema.finance_accounts)
      .orderBy(asc(schema.finance_accounts.code));
  }

  async getAccount(id: number) {
    const [account] = await this.db
      .select()
      .from(schema.finance_accounts)
      .where(eq(schema.finance_accounts.id, id));
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async createAccount(dto: any) {
    const data: any = { ...dto };
    const [result] = await this.db
      .insert(schema.finance_accounts)
      .values(data)
      .returning();
    return result;
  }

  async updateAccount(id: number, dto: any) {
    await this.getAccount(id);
    const data: any = { ...dto };
    await this.db
      .update(schema.finance_accounts)
      .set(data)
      .where(eq(schema.finance_accounts.id, id));
    return this.getAccount(id);
  }

  async deleteAccount(id: number) {
    await this.getAccount(id);
    await this.db
      .delete(schema.finance_accounts)
      .where(eq(schema.finance_accounts.id, id));
    return { message: 'Deleted' };
  }

  async listJournalEntries() {
    const entries = await this.db
      .select()
      .from(schema.finance_journal_entries)
      .orderBy(desc(schema.finance_journal_entries.id));
    const results: any[] = [];
    for (const entry of entries) {
      const lines = await this.db
        .select()
        .from(schema.finance_journal_lines)
        .where(eq(schema.finance_journal_lines.entry_id, entry.id));
      results.push({ ...entry, lines });
    }
    return results;
  }

  async getJournalEntry(id: number) {
    const [entry] = await this.db
      .select()
      .from(schema.finance_journal_entries)
      .where(eq(schema.finance_journal_entries.id, id));
    if (!entry) throw new NotFoundException('Journal entry not found');
    const lines = await this.db
      .select()
      .from(schema.finance_journal_lines)
      .where(eq(schema.finance_journal_lines.entry_id, id));
    return { ...entry, lines };
  }

  async createJournalEntry(dto: any) {
    const entry_no = `JE-${Date.now()}`;
    const [saved] = await this.db
      .insert(schema.finance_journal_entries)
      .values({
        entry_no,
        entry_date: dto.entry_date || dto.entryDate,
        memo: dto.memo,
        status: 'draft',
      })
      .returning();

    if (dto.lines) {
      for (const line of dto.lines) {
        await this.db.insert(schema.finance_journal_lines).values({
          entry_id: saved.id,
          account_id: line.account_id || line.accountId,
          description: line.description,
          debit: line.debit || 0,
          credit: line.credit || 0,
        });
      }
    }
    return this.getJournalEntry(saved.id);
  }

  async updateJournalEntry(id: number, dto: any) {
    await this.getJournalEntry(id);
    await this.db
      .update(schema.finance_journal_entries)
      .set(dto)
      .where(eq(schema.finance_journal_entries.id, id));
    return this.getJournalEntry(id);
  }

  async deleteJournalEntry(id: number) {
    await this.getJournalEntry(id);
    await this.db
      .delete(schema.finance_journal_entries)
      .where(eq(schema.finance_journal_entries.id, id));
    return { message: 'Deleted' };
  }

  async postJournalEntry(id: number) {
    await this.db
      .update(schema.finance_journal_entries)
      .set({
        status: 'posted',
        posted_at: new Date().toISOString(),
      })
      .where(eq(schema.finance_journal_entries.id, id));
    return this.getJournalEntry(id);
  }

  private generateExpenseId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EXP-${timestamp}${random}`;
  }

  async listExpenses(query: {
    from_date?: string;
    to_date?: string;
    status?: string;
    category?: string;
    limit?: number;
  }) {
    const filters: SQL[] = [];
    if (query.from_date && query.to_date) {
      filters.push(
        between(schema.expenses.expense_date, query.from_date, query.to_date),
      );
    }
    if (query.status) {
      filters.push(eq(schema.expenses.status, query.status));
    }
    if (query.category) {
      filters.push(eq(schema.expenses.category, query.category));
    }
    const finalFilter = filters.length > 0 ? and(...filters) : undefined;
    return this.db
      .select()
      .from(schema.expenses)
      .where(finalFilter)
      .limit(query.limit || 100)
      .orderBy(desc(schema.expenses.id));
  }

  async getExpense(id: number) {
    const [expense] = await this.db
      .select()
      .from(schema.expenses)
      .where(eq(schema.expenses.id, id));
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async createExpense(dto: any) {
    const data: any = {
      expense_id: this.generateExpenseId(),
      expense_date: dto.expense_date,
      category: dto.category,
      description: dto.description,
      amount: dto.amount,
      status: 'PENDING',
    };
    const [result] = await this.db
      .insert(schema.expenses)
      .values(data)
      .returning();
    return result;
  }

  async updateExpense(id: number, dto: any) {
    await this.getExpense(id);
    const data: any = {
      expense_date: dto.expense_date,
      category: dto.category,
      description: dto.description,
      amount: dto.amount,
    };
    await this.db
      .update(schema.expenses)
      .set(data)
      .where(eq(schema.expenses.id, id));
    return this.getExpense(id);
  }

  async deleteExpense(id: number) {
    await this.getExpense(id);
    await this.db.delete(schema.expenses).where(eq(schema.expenses.id, id));
    return { message: 'Deleted' };
  }

  private async setExpenseStatus(id: number, status: string) {
    await this.getExpense(id);
    await this.db
      .update(schema.expenses)
      .set({ status })
      .where(eq(schema.expenses.id, id));
    return this.getExpense(id);
  }

  async approveExpense(id: number) {
    return this.setExpenseStatus(id, 'APPROVED');
  }

  async payExpense(id: number) {
    return this.setExpenseStatus(id, 'PAID');
  }

  async undoPayment(id: number) {
    return this.setExpenseStatus(id, 'APPROVED');
  }

  async getMonthlyExpensesSummary(month: string) {
    const rows = await this.db
      .select()
      .from(schema.expenses)
      .where(like(schema.expenses.expense_date, `${month}%`));
    const expenses = rows as any[];

    let totalExpenses = 0;
    let pendingTotal = 0;
    let approvedTotal = 0;
    let paidTotal = 0;
    const categories: Record<string, number> = {};

    for (const e of expenses) {
      const amount = Number(e.amount || 0);
      const status = (e.status || '').toString().toUpperCase();
      const category = e.category || 'Uncategorized';

      totalExpenses += amount;
      if (status === 'PENDING') pendingTotal += amount;
      if (status === 'APPROVED') approvedTotal += amount;
      if (status === 'PAID') paidTotal += amount;

      categories[category] = (categories[category] || 0) + amount;
    }

    return {
      total_expenses: totalExpenses,
      pending_expenses: pendingTotal,
      approved_expenses: approvedTotal,
      paid_expenses: paidTotal,
      expense_count: expenses.length,
      categories,
    };
  }
}
