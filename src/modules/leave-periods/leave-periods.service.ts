import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import * as schema from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, sql, SQL } from 'drizzle-orm';

@Injectable()
export class LeavePeriodsService {
  constructor(
    @Inject(DRIZZLE)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(query: { employee_id?: string; active_on?: string }) {
    const filters: SQL[] = [];
    if (query.employee_id) filters.push(eq(schema.leavePeriods.employee_id, query.employee_id));
    if (query.active_on) {
      filters.push(sql`${query.active_on} BETWEEN ${schema.leavePeriods.from_date} AND ${schema.leavePeriods.to_date}`);
    }

    const finalFilter = filters.length > 0 ? and(...filters) : undefined;

    return this.db.select().from(schema.leavePeriods)
      .where(finalFilter)
      .orderBy(desc(schema.leavePeriods.id));
  }

  async create(dto: any) {
    const data: any = { ...dto };
    // Mapping handled by snake_case keys in schema
    const [result] = await this.db.insert(schema.leavePeriods).values(data).returning();
    return result;
  }

  async update(id: number, dto: any) {
    const data: any = { ...dto };
    await this.db.update(schema.leavePeriods).set(data).where(eq(schema.leavePeriods.id, id));
    const [updated] = await this.db.select().from(schema.leavePeriods).where(eq(schema.leavePeriods.id, id));
    return updated;
  }

  async remove(id: number) {
    await this.db.delete(schema.leavePeriods).where(eq(schema.leavePeriods.id, id));
    return { message: 'Deleted' };
  }

  async getAlerts(query: { as_of?: string; employee_id?: string }) {
    const periods = await this.findAll({ employee_id: query.employee_id });
    const today = query.as_of ? new Date(query.as_of) : new Date();
    
    return (periods as any[]).filter(p => {
      const toDate = new Date(p.to_date);
      const daysRemaining = Math.ceil((toDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 3 && daysRemaining >= 0;
    }).map(p => ({
      leave_period_id: p.id,
      employee_id: p.employee_id,
      from_date: p.from_date,
      to_date: p.to_date,
      leave_type: p.leave_type,
      reason: p.reason,
      last_day: p.to_date,
      message: 'Leave period ending soon',
    }));
  }
}
