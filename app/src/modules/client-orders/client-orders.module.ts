import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ClientOrdersController } from './client-orders.controller';
import { ClientOrdersService } from './client-orders.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ClientOrdersController],
  providers: [ClientOrdersService],
})
export class ClientOrdersModule {}
