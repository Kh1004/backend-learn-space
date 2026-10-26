import { v4 as uuidv4 } from 'uuid';

export abstract class BaseEvent {
  readonly eventId: string;
  readonly timestamp: Date;

  constructor(
    public readonly userId: string,
    public readonly action: string,
  ) {
    this.eventId = uuidv4();
    this.timestamp = new Date();
  }
}
