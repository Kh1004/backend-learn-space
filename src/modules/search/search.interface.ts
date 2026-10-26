export interface SearchOptions {
  query: string;
  types?: SearchableType[];
  filters?: Record<string, unknown>;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type SearchableType =
  | 'material'
  | 'subject'
  | 'category'
  | 'tag'
  | 'teacher'
  | 'user';

export interface SearchResult<T = Record<string, unknown>> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  query: string;
  took: number;
}

export interface SearchProvider {
  search<T>(options: SearchOptions): Promise<SearchResult<T>>;
  index(type: SearchableType, id: string, data: Record<string, unknown>): Promise<void>;
  remove(type: SearchableType, id: string): Promise<void>;
}
