export class ServerError extends Error {
  status: number;
  // Optionally include the original error that was thrown
  error?: Error;
  constructor(message: string, error?: Error) {
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
