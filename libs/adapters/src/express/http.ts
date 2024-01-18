export type HttpStatusCode = 200 | 400 | 401 | 403 | 404 | 409 | 500;

export type HttpResponse<T> = {
  status: HttpStatusCode;
  statusText?: string;
  result?: T;
  error?: {
    message: string;
    details?: any;
    stack?: string;
  };
};

export const Ok = <T>(result?: any): HttpResponse<T> => ({
  status: 200,
  statusText: 'OK',
  result,
});

export const BadRequest = (
  message?: string,
  details?: any,
): HttpResponse<never> => ({
  status: 400,
  statusText: 'Bad Request',
  error: { message: message ?? 'Bad Request', details },
});

export const Unauthorized = (message?: string): HttpResponse<never> => ({
  status: 401,
  statusText: 'Unauthorized',
  error: { message: message ?? 'Unauthorized' },
});

export const Forbidden = (message?: string): HttpResponse<never> => ({
  status: 403,
  statusText: 'Forbidden',
  error: { message: message ?? 'Forbidden' },
});

export const NotFound = (message?: string): HttpResponse<never> => ({
  status: 404,
  statusText: 'Not Found',
  error: { message: message ?? 'Not Found' },
});

export const Conflict = (message?: string): HttpResponse<never> => ({
  status: 409,
  statusText: 'Conflict',
  error: { message: message ?? 'Conflict' },
});

export const InternalServerError = (
  message?: string,
  stack?: string,
): HttpResponse<never> => ({
  status: 500,
  statusText: 'Internal Server Error',
  error: {
    message: message ?? 'Internal Server Error',
    stack: process.env.NODE_ENV !== 'production' ? stack : undefined,
  },
});
