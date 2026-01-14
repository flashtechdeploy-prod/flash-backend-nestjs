import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import * as schema from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class PayrollService {
  constructor(
    @Inject(DRIZZLE)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async getPaymentStatus(month: string, employeeId: string) {
    const [status] = await this.db.select().from(schema.payrollPaymentStatus)
      .where(and(eq(schema.payrollPaymentStatus.month, month), eq(schema.payrollPaymentStatus.employee_id, employeeId)));
    return status || { employee_id: employeeId, month, status: 'unpaid' };
  }

  async upsertPaymentStatus(dto: { month: string; employee_id: string; status: string }) {
    const [existing] = await this.db.select().from(schema.payrollPaymentStatus)
      .where(and(eq(schema.payrollPaymentStatus.month, dto.month), eq(schema.payrollPaymentStatus.employee_id, dto.employee_id)));
    
    if (existing) {
      await this.db.update(schema.payrollPaymentStatus).set({ status: dto.status }).where(eq(schema.payrollPaymentStatus.id, (existing as any).id));
    } else {
      await this.db.insert(schema.payrollPaymentStatus).values({
        employee_id: dto.employee_id,
        month: dto.month,
        status: dto.status
      });
    }
    return this.getPaymentStatus(dto.month, dto.employee_id);
  }

  async getReport(month: string) {
    return {
      month,
      summary: { month, employees: 0, total_gross: 0, total_net: 0 },
      rows: [],
    };
  }

  async getRangeReport(fromDate: string, toDate: string, month?: string) {
    return { from_date: fromDate, to_date: toDate, month, rows: [] };
  }

  async listSheetEntries(fromDate: string, toDate: string) {
    return this.db.select().from(schema.payrollSheetEntries)
      .where(and(eq(schema.payrollSheetEntries.from_date, fromDate), eq(schema.payrollSheetEntries.to_date, toDate)));
  }

  async bulkUpsertSheetEntries(dto: { from_date: string; to_date: string; entries: any[] }) {
    let upserted = 0;
    for (const entry of dto.entries) {
      const [existing] = await this.db.select().from(schema.payrollSheetEntries)
        .where(and(
          eq(schema.payrollSheetEntries.employee_db_id, entry.employee_db_id),
          eq(schema.payrollSheetEntries.from_date, dto.from_date),
          eq(schema.payrollSheetEntries.to_date, dto.to_date)
        ));
      
      const data: any = {
        employee_db_id: entry.employee_db_id,
        from_date: dto.from_date,
        to_date: dto.to_date,
        pre_days_override: entry.pre_days_override,
        cur_days_override: entry.cur_days_override,
        leave_encashment_days: entry.leave_encashment_days,
        allow_other: entry.allow_other,
        eobi: entry.eobi,
        tax: entry.tax,
        fine_adv_extra: entry.fine_adv_extra,
        ot_rate_override: entry.ot_rate_override,
        remarks: entry.remarks,
        bank_cash: entry.bank_cash
      };

      if (existing) {
        await this.db.update(schema.payrollSheetEntries).set(data).where(eq(schema.payrollSheetEntries.id, (existing as any).id));
      } else {
        await this.db.insert(schema.payrollSheetEntries).values(data);
      }
      upserted++;
    }
    return { upserted };
  }

  async exportPdf(query: any, body: any) {
    // This is a placeholder for actual PDF generation logic
    return { 
      message: 'PDF export logic would go here',
      timestamp: new Date().toISOString(),
      report_type: 'payroll_summary'
    };
  }
}
