import { BaseEvent } from './base-event';

export class MaterialPublishedEvent extends BaseEvent {
  static readonly ACTION = 'material.published';

  constructor(
    userId: string,
    public readonly materialId: string,
    public readonly materialTitle: string,
    public readonly subjectId: string,
    public readonly gradeId: string,
  ) {
    super(userId, MaterialPublishedEvent.ACTION);
  }
}

export class MaterialArchivedEvent extends BaseEvent {
  static readonly ACTION = 'material.archived';

  constructor(
    userId: string,
    public readonly materialId: string,
  ) {
    super(userId, MaterialPublishedEvent.ACTION);
  }
}

export class MaterialViewedEvent extends BaseEvent {
  static readonly ACTION = 'material.viewed';

  constructor(
    userId: string,
    public readonly materialId: string,
  ) {
    super(userId, MaterialViewedEvent.ACTION);
  }
}

export class MaterialDownloadedEvent extends BaseEvent {
  static readonly ACTION = 'material.downloaded';

  constructor(
    userId: string,
    public readonly materialId: string,
    public readonly fileId: string,
  ) {
    super(userId, MaterialDownloadedEvent.ACTION);
  }
}

export class MaterialBookmarkedEvent extends BaseEvent {
  static readonly ACTION = 'material.bookmarked';

  constructor(
    userId: string,
    public readonly materialId: string,
  ) {
    super(userId, MaterialBookmarkedEvent.ACTION);
  }
}

export class MaterialLikedEvent extends BaseEvent {
  static readonly ACTION = 'material.liked';

  constructor(
    userId: string,
    public readonly materialId: string,
  ) {
    super(userId, MaterialLikedEvent.ACTION);
  }
}
