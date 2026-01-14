import { Module } from '@nestjs/common';
import { ClientManagementService } from './client-management.service';
import { ClientManagementController } from './client-management.controller';

@Module({
  providers: [ClientManagementService],
  controllers: [ClientManagementController],
  exports: [ClientManagementService],
})
export class ClientManagementModule {}
