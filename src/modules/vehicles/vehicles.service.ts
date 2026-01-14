import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import * as schema from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc } from 'drizzle-orm';

@Injectable()
export class VehiclesService {
  constructor(
    @Inject(DRIZZLE)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(skip = 0, limit = 100) {
    return this.db.select().from(schema.vehicles)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(schema.vehicles.id));
  }

  async findOne(vehicleId: string) {
    const [vehicle] = await this.db.select().from(schema.vehicles).where(eq(schema.vehicles.vehicle_id, vehicleId));
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} not found`);
    }
    
    const documents = await this.db.select().from(schema.vehicleDocuments).where(eq(schema.vehicleDocuments.vehicle_id, vehicleId));
    const images = await this.db.select().from(schema.vehicleImages).where(eq(schema.vehicleImages.vehicle_id, vehicleId));

    return { ...vehicle, documents, images };
  }

  async create(createDto: any) {
    const data: any = { ...createDto };
    // Mapping handled by snake_case keys in schema
    const [result] = await this.db.insert(schema.vehicles).values(data).returning();
    return result;
  }

  async update(vehicleId: string, updateDto: any) {
    await this.findOne(vehicleId);
    
    const data: any = { ...updateDto };
    await this.db.update(schema.vehicles).set(data).where(eq(schema.vehicles.vehicle_id, vehicleId));
    return this.findOne(vehicleId);
  }

  async remove(vehicleId: string) {
    await this.findOne(vehicleId);
    await this.db.delete(schema.vehicles).where(eq(schema.vehicles.vehicle_id, vehicleId));
    return { message: `Vehicle ${vehicleId} deleted` };
  }

  async importBulk(vehicles: any[]) {
    let imported = 0;
    for (const v of vehicles) {
      try {
        await this.create(v);
        imported++;
      } catch (e) {}
    }
    return { imported };
  }

  // Documents
  async listDocuments(vehicleId: string) {
    return this.db.select().from(schema.vehicleDocuments).where(eq(schema.vehicleDocuments.vehicle_id, vehicleId)).orderBy(desc(schema.vehicleDocuments.created_at));
  }

  async uploadDocument(vehicleId: string, filename: string, url: string, mimeType: string) {
    const [result] = await this.db.insert(schema.vehicleDocuments).values({
      vehicle_id: vehicleId,
      filename,
      url,
      mime_type: mimeType,
    }).returning();
    return result;
  }

  async deleteDocument(vehicleId: string, docId: number) {
    await this.db.delete(schema.vehicleDocuments).where(and(eq(schema.vehicleDocuments.id, docId), eq(schema.vehicleDocuments.vehicle_id, vehicleId)));
    return { message: 'Document deleted' };
  }

  // Images
  async listImages(vehicleId: string) {
    return this.db.select().from(schema.vehicleImages).where(eq(schema.vehicleImages.vehicle_id, vehicleId)).orderBy(desc(schema.vehicleImages.created_at));
  }

  async uploadImage(vehicleId: string, filename: string, url: string, mimeType: string) {
    const [result] = await this.db.insert(schema.vehicleImages).values({
      vehicle_id: vehicleId,
      filename,
      url,
      mime_type: mimeType,
    }).returning();
    return result;
  }

  async deleteImage(vehicleId: string, imageId: number) {
    await this.db.delete(schema.vehicleImages).where(and(eq(schema.vehicleImages.id, imageId), eq(schema.vehicleImages.vehicle_id, vehicleId)));
    return { message: 'Image deleted' };
  }
}
