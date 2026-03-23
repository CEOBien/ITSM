import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangesService } from './changes.service';
import { ChangesController } from './changes.controller';
import { Change } from './entities/change.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Change])],
  controllers: [ChangesController],
  providers: [ChangesService],
  exports: [ChangesService],
})
export class ChangesModule {}
