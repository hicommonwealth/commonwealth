export const RATE_LIMIT_MESSAGE =
  'You are being rate limited. Please wait and try again.';

interface RateLimitErrorType {
  data?: { httpStatus?: number; message?: string };
  status?: number;
  response?: { status?: number; data?: { message?: string } };
  message?: string;
}

export const isRateLimitError = (err: RateLimitErrorType) => {
  const status = err?.data?.httpStatus || err?.status || err?.response?.status;
  if (status === 429) return true;

  const msg =
    err?.data?.message || err?.message || err?.response?.data?.message || '';
  const lowerMsg = String(msg).toLowerCase();
  return (
    lowerMsg.includes('rate limit') || lowerMsg.includes('too many requests')
  );
};
