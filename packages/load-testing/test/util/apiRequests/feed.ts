import http from 'k6/http';
import { checkResStatus } from '../utils.ts';

// TODO: refactor to get requests in API
export function viewGlobalActivity(apiUrl: string): boolean {
  return checkResStatus(http.post(`${apiUrl}/viewGlobalActivity`), 200);
}

// TODO: refactor to get requests in API
export function viewUserActivity(apiUrl: string, jwt: string): boolean {
  return checkResStatus(
    http.post(
      `${apiUrl}/viewUserActivity`,
      JSON.stringify({
        jwt,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ),
    200,
  );
}
