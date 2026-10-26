import { Module } from '@nestjs/common';
import { NotificationListener } from './listeners/notification.listener';
import { ActivityListener } from './listeners/activity.listener';

@Module({
  providers: [NotificationListener, ActivityListener],
  exports: [NotificationListener, ActivityListener],
})
export class ListenersModule {}
