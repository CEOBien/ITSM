import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';
import { Sla } from './entities/sla.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sla])],
  controllers: [SlaController],
  providers: [SlaService],
  exports: [SlaService],
})
export class SlaModule {}
