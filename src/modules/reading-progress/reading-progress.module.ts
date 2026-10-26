import { Module } from '@nestjs/common';
import { ReadingProgressService } from './reading-progress.service';
import { ReadingProgressController } from './reading-progress.controller';

@Module({
  controllers: [ReadingProgressController],
  providers: [ReadingProgressService],
  exports: [ReadingProgressService],
})
export class ReadingProgressModule {}
