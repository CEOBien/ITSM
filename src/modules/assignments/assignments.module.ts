import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentGroup } from './entities/assignment-group.entity';
import { AssignmentGroupsService } from './assignment-groups.service';
import { AssignmentGroupsController } from './assignment-groups.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AssignmentGroup])],
  controllers: [AssignmentGroupsController],
  providers: [AssignmentGroupsService],
  exports: [TypeOrmModule.forFeature([AssignmentGroup]), AssignmentGroupsService],
})
export class AssignmentsModule {}
