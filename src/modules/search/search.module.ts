import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { PostgresSearchProvider } from './providers/postgres-search.provider';

@Module({
  controllers: [SearchController],
  providers: [SearchService, PostgresSearchProvider],
  exports: [SearchService],
})
export class SearchModule {}
