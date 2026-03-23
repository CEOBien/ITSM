import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmdbService } from './cmdb.service';
import { CmdbController } from './cmdb.controller';
import { ConfigurationItem } from './entities/configuration-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConfigurationItem])],
  controllers: [CmdbController],
  providers: [CmdbService],
  exports: [CmdbService],
})
export class CmdbModule {}
