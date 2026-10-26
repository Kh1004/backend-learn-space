import { BaseEvent } from './base-event';
import { Role } from '../enums';

export class UserCreatedEvent extends BaseEvent {
  static readonly ACTION = 'user.created';

  constructor(
    userId: string,
    public readonly email: string,
    public readonly role: Role,
  ) {
    super(userId, UserCreatedEvent.ACTION);
  }
}

export class UserLoginEvent extends BaseEvent {
  static readonly ACTION = 'user.login';

  constructor(
    userId: string,
    public readonly ip?: string,
  ) {
    super(userId, UserLoginEvent.ACTION);
  }
}

export class UserLogoutEvent extends BaseEvent {
  static readonly ACTION = 'user.logout';

  constructor(userId: string) {
    super(userId, UserLogoutEvent.ACTION);
  }
}
