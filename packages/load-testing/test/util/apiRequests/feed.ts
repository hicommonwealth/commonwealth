import http from 'k6/http';
import { checkResStatus } from '../utils.ts';

// TODO: refactor to get requests in API
export function getGlobalActivity(apiUrl: string): boolean {
  return checkResStatus(http.post(`${apiUrl}/feed.GetGlobalActivity`), 200);
}

// TODO: refactor to get requests in API
export function getUserActivity(apiUrl: string, jwt: string): boolean {
  return checkResStatus(
    http.post(
      `${apiUrl}/feed.GetUserActivity`,
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
