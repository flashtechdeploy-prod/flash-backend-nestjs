import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import * as schema from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, between, asc } from 'drizzle-orm';

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(DRIZZLE)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async findByDate(date: string) {
    const records = await this.db
      .select()
      .from(schema.attendance)
      .where(eq(schema.attendance.date, date))
      .orderBy(asc(schema.attendance.employee_id));
    return { date, records };
  }

  async findByRange(fromDate: string, toDate: string) {
    return this.db
      .select()
      .from(schema.attendance)
      .where(between(schema.attendance.date, fromDate, toDate))
      .orderBy(asc(schema.attendance.date), asc(schema.attendance.employee_id));
  }

  async findByEmployee(employeeId: string, fromDate: string, toDate: string) {
    return this.db
      .select()
      .from(schema.attendance)
      .where(
        and(
          eq(schema.attendance.employee_id, employeeId),
          between(schema.attendance.date, fromDate, toDate),
        ),
      )
      .orderBy(asc(schema.attendance.date));
  }

  async bulkUpsert(date: string, records: any[]) {
    let upserted = 0;
    const leaveRecords: any[] = [];

    for (const record of records) {
      const [existing] = await this.db
        .select()
        .from(schema.attendance)
        .where(
          and(
            eq(schema.attendance.employee_id, record.employee_id),
            eq(schema.attendance.date, date),
          ),
        );

      const data: any = {
        employee_id: record.employee_id,
        date: date,
        status: record.status,
        note: record.note,
        overtime_minutes: record.overtime_minutes,
        overtime_rate: record.overtime_rate,
        late_minutes: record.late_minutes,
        late_deduction: record.late_deduction,
        leave_type: record.leave_type,
        fine_amount: record.fine_amount,
      };

      if (existing) {
        await this.db
          .update(schema.attendance)
          .set(data)
          .where(eq(schema.attendance.id, (existing as any).id));
      } else {
        await this.db.insert(schema.attendance).values(data);
      }
      upserted++;

      // Collect leave records for automatic leave period creation
      if (record.status === 'leave' && record.leave_type) {
        leaveRecords.push({
          employee_id: record.employee_id,
          date: date,
          leave_type: record.leave_type,
          note: record.note,
        });
      }
    }

    // Auto-create leave periods for leave attendance
    if (leaveRecords.length > 0) {
      await this.autoCreateLeavePeriods(leaveRecords);
    }

    return { upserted };
  }

  /**
   * Automatically create or extend leave periods based on attendance
   * Groups consecutive leave days into single leave periods
   */
  private async autoCreateLeavePeriods(leaveRecords: any[]) {
    for (const leave of leaveRecords) {
      const currentDate = leave.date;
      const employeeId = leave.employee_id;
      const leaveType = leave.leave_type;

      // Check if there's an existing leave period that can be extended
      // Look for leave periods ending yesterday or starting tomorrow
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Find leave period ending yesterday (extend forward)
      const [extendForward] = await this.db
        .select()
        .from(schema.leavePeriods)
        .where(
          and(
            eq(schema.leavePeriods.employee_id, employeeId),
            eq(schema.leavePeriods.to_date, yesterdayStr),
            eq(schema.leavePeriods.leave_type, leaveType),
          ),
        );

      // Find leave period starting tomorrow (extend backward)
      const [extendBackward] = await this.db
        .select()
        .from(schema.leavePeriods)
        .where(
          and(
            eq(schema.leavePeriods.employee_id, employeeId),
            eq(schema.leavePeriods.from_date, tomorrowStr),
            eq(schema.leavePeriods.leave_type, leaveType),
          ),
        );

      if (extendForward) {
        // Extend the leave period forward
        await this.db
          .update(schema.leavePeriods)
          .set({ to_date: currentDate })
          .where(eq(schema.leavePeriods.id, extendForward.id));
      } else if (extendBackward) {
        // Extend the leave period backward
        await this.db
          .update(schema.leavePeriods)
          .set({ from_date: currentDate })
          .where(eq(schema.leavePeriods.id, extendBackward.id));
      } else {
        // Check if leave period already exists for this exact date
        const [existing] = await this.db
          .select()
          .from(schema.leavePeriods)
          .where(
            and(
              eq(schema.leavePeriods.employee_id, employeeId),
              eq(schema.leavePeriods.from_date, currentDate),
              eq(schema.leavePeriods.to_date, currentDate),
            ),
          );

        if (!existing) {
          // Create new single-day leave period
          await this.db.insert(schema.leavePeriods).values({
            employee_id: employeeId,
            from_date: currentDate,
            to_date: currentDate,
            leave_type: leaveType,
            reason: leave.note || `Auto-created from attendance (${leaveType})`,
          });
        }
      }
    }
  }

  async getSummary(
    fromDate: string,
    toDate: string,
    _query: { department?: string; designation?: string },
  ) {
    const records = await this.findByRange(fromDate, toDate);

    const summary = {
      from_date: fromDate,
      to_date: toDate,
      total_records: records.length,
      by_status: {} as Record<string, number>,
    };

    records.forEach((r) => {
      summary.by_status[r.status] = (summary.by_status[r.status] || 0) + 1;
    });

    return summary;
  }
}
