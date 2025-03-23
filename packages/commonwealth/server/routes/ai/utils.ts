/**
 * Extract OpenRouter-specific error information
 */
function extractOpenRouterError(
  error: any,
): { code: number; message: string; metadata?: any } | null {
  // Check OpenRouter API error format
  if (error.error?.code && error.error?.message) {
    return {
      code: error.error.code,
      message: error.error.message,
      metadata: error.error.metadata,
    };
  }

  // Check OpenAI SDK error format that might contain OpenRouter error
  if (error.status && (error.error || error.message)) {
    return {
      code: error.status,
      message: error.error?.message || error.message || 'Unknown error',
      metadata: error.error,
    };
  }

  return null;
}

export { extractOpenRouterError };
