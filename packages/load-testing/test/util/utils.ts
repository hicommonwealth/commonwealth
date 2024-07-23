import { check } from 'k6';
import { RefinedResponse } from 'k6/http';

export function checkResStatus(
  res: RefinedResponse<any>,
  desiredStatus: number,
): boolean {
  return check(res, {
    [`is status ${desiredStatus}`]: (r) => r.status === desiredStatus,
  });
}

export const IgnoreLifecycleMetrics = {
  thresholds: {
    'http_req_duration{scenario:default}': ['max>=0'],
  },
};
