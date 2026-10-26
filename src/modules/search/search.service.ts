import { Injectable } from '@nestjs/common';
import { SearchProvider, SearchOptions, SearchResult } from './search.interface';
import { PostgresSearchProvider } from './providers/postgres-search.provider';

@Injectable()
export class SearchService {
  constructor(
    private readonly postgresProvider: PostgresSearchProvider,
  ) {}

  async search<T>(options: SearchOptions): Promise<SearchResult<T>> {
    return this.postgresProvider.search<T>(options);
  }
}
