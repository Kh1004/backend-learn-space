import { Global, Module } from '@nestjs/common';
import { CacheConfigModule } from '../../modules/cache/cache.module';
import { StorageService } from './storage.service';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [CacheConfigModule.register()],
  providers: [StorageService, CacheService],
  exports: [StorageService, CacheService],
})
export class CommonModule {}
