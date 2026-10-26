import { BaseEvent } from './base-event';

export class ActivityEvent extends BaseEvent {
  static readonly ACTION = 'activity';

  constructor(
    userId: string,
    public readonly activityType: ActivityType,
    public readonly resourceType: string,
    public readonly resourceId: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(userId, ActivityEvent.ACTION);
  }
}

export enum ActivityType {
  VIEW = 'VIEW',
  OPEN = 'OPEN',
  READ = 'READ',
  DOWNLOAD = 'DOWNLOAD',
  BOOKMARK = 'BOOKMARK',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  REPORT = 'REPORT',
  FOLLOW = 'FOLLOW',
  SEARCH = 'SEARCH',
}
