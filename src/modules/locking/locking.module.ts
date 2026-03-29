import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LockingService } from './locking.service';
import { LockingController } from './locking.controller';
import { ObjectLockingConfig } from './entities/object-locking-config.entity';
import { ObjectLock } from './entities/object-lock.entity';
import { LockingGuard } from '@core/guards/locking.guard';

/**
 * @Global() — LockingService cần được inject vào LockingGuard
 * mà guard được đăng ký toàn cục trong AppModule.
 * Global module tránh việc phải import LockingModule ở mọi nơi.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ObjectLockingConfig, ObjectLock])],
  controllers: [LockingController],
  providers: [LockingService, LockingGuard],
  exports: [LockingService, LockingGuard],
})
export class LockingModule {}
