import type { ISnapshotNotification } from '@hicommonwealth/shared';

export abstract class EventHandler<DBEventType = ISnapshotNotification> {
  public abstract handle(
    event: ISnapshotNotification,
    dbEvent?: DBEventType,
  ): Promise<DBEventType>;
}

export class ServerError extends Error {
  status: number;
  error: any;
  constructor(message: string, error?: any) {
    super(message);
    this.status = 500;
    this.name = 'ServerError';
    this.error = error;
  }
}

export class AppError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.status = 400;
    this.name = 'AppError';
  }
}
