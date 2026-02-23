import {
  CompletionModel,
  CompletionOptions,
  DEFAULT_COMPLETION_MODEL,
} from '@hicommonwealth/shared';
import { useCallback, useRef, useState } from 'react';
import { userStore } from 'state/ui/user';

/**
 * Completion types that can be requested from the AI completion endpoint
 * Note: ThreadTitle is not included as title generation requires client-side text input
 */
export enum AICompletionType {
  Thread = 'thread',
  Comment = 'comment',
  Poll = 'poll',
}

// Delimiters sent by backend in streaming responses
const COMMENT_PAYLOAD_DELIMITER = '\n__COMMENT_PAYLOAD__\n';
const STREAM_ERROR_PREFIX = '\n__STREAM_ERROR__\n';
const COMMENT_ERROR_DELIMITER = '\n__COMMENT_ERROR__\n';

const STREAM_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

interface AiCompletionOptions extends Partial<CompletionOptions> {
  onChunk?: (chunk: string) => void;
  onComplete?: (
    fullText: string,
    commentPayload?: Record<string, unknown>,
  ) => void | Promise<void>;
  onError?: (error: Error) => void;
  onCommentError?: (error: string) => void;
  webSearchEnabled?: boolean;
}

/**
 * Input for generating AI completions using entity IDs
 * For Comment completions, either parentCommentId or threadId must be provided:
 * - parentCommentId: AI replies to an existing comment
 * - threadId: AI creates a root-level comment on the thread
 */
export interface AICompletionInput {
  communityId: string;
  completionType: AICompletionType;
  parentCommentId?: number;
  threadId?: number; // For root-level AI comments (no parent comment)
  topicId?: number;
  model?: CompletionModel;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  useOpenRouter?: boolean;
  webSearchEnabled?: boolean;
}

interface CompletionError {
  error: string;
  status?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Hook for streaming AI completions from the server
 * Uses entity IDs for secure server-side context building
 *
 * For Comment completions, the server automatically creates the AI comment
 * after the completion finishes - no additional client action needed.
 */
export const useAiCompletion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [completion, setCompletion] = useState<string>('');
  const activeControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
  }, []);

  const generateCompletion = useCallback(
    async (input: AICompletionInput, options?: AiCompletionOptions) => {
      // Cancel any prior in-flight request
      activeControllerRef.current?.abort();

      const controller = new AbortController();
      activeControllerRef.current = controller;

      // 2-minute timeout
      const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

      setIsLoading(true);
      setError(null);
      setCompletion('');

      let accumulatedText = '';
      const streamMode = input.stream !== false;

      try {
        const requestBody = {
          communityId: input.communityId,
          completionType: input.completionType,
          parentCommentId: input.parentCommentId,
          threadId: input.threadId,
          topicId: input.topicId,
          model: input.model || options?.model || DEFAULT_COMPLETION_MODEL,
          temperature:
            typeof input.temperature === 'number'
              ? input.temperature
              : options?.temperature,
          maxTokens: input.maxTokens || options?.maxTokens,
          stream: streamMode,
          useOpenRouter: input.useOpenRouter || options?.useOpenRouter,
          webSearchEnabled: input.webSearchEnabled || options?.webSearchEnabled,
          jwt: userStore.getState().jwt,
        };

        const response = await fetch('/api/aicompletion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorData: CompletionError;
          try {
            errorData = await response.json();
          } catch {
            errorData = {
              error: `Server responded with ${response.status}: ${response.statusText}`,
            };
          }

          const errorMessage = errorData.error || `Error ${response.status}`;
          throw new Error(errorMessage);
        }

        if (streamMode) {
          if (!response.body) {
            throw new Error('ReadableStream not supported in this browser.');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          // Abort the reader when the signal fires
          controller.signal.addEventListener('abort', () => {
            reader.cancel().catch(() => {});
          });

          let fullStreamContent = '';

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Extract delimited sections from accumulated stream content
              let displayText = fullStreamContent;
              let commentPayload: Record<string, unknown> | undefined;

              // Check for stream error
              if (fullStreamContent.includes(STREAM_ERROR_PREFIX)) {
                const errIdx = fullStreamContent.indexOf(STREAM_ERROR_PREFIX);
                displayText = fullStreamContent.substring(0, errIdx);
                const errMsg = fullStreamContent
                  .substring(errIdx + STREAM_ERROR_PREFIX.length)
                  .trim();
                throw new Error(errMsg || 'Streaming error');
              }

              // Check for comment creation error
              if (fullStreamContent.includes(COMMENT_ERROR_DELIMITER)) {
                const errIdx = fullStreamContent.indexOf(
                  COMMENT_ERROR_DELIMITER,
                );
                displayText = fullStreamContent.substring(0, errIdx);
                const errPayload = fullStreamContent
                  .substring(errIdx + COMMENT_ERROR_DELIMITER.length)
                  .trim();
                options?.onCommentError?.(
                  errPayload || 'Failed to create comment',
                );
              }

              // Check for comment payload
              if (displayText.includes(COMMENT_PAYLOAD_DELIMITER)) {
                const delimiterIndex = displayText.indexOf(
                  COMMENT_PAYLOAD_DELIMITER,
                );
                const jsonPayload = displayText
                  .substring(delimiterIndex + COMMENT_PAYLOAD_DELIMITER.length)
                  .trim();
                displayText = displayText.substring(0, delimiterIndex);

                try {
                  commentPayload = JSON.parse(jsonPayload);
                } catch {
                  // payload parse failure is non-fatal
                }
              }

              accumulatedText = displayText;
              setCompletion(displayText);

              await options?.onComplete?.(displayText, commentPayload);
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            fullStreamContent += chunk;

            // Check for stream error mid-stream
            if (fullStreamContent.includes(STREAM_ERROR_PREFIX)) {
              const errIdx = fullStreamContent.indexOf(STREAM_ERROR_PREFIX);
              const errMsg = fullStreamContent
                .substring(errIdx + STREAM_ERROR_PREFIX.length)
                .trim();
              throw new Error(errMsg || 'Streaming error');
            }

            // Only update displayed text up to any delimiter if it appears mid-stream
            let displayChunk = chunk;
            if (fullStreamContent.includes(COMMENT_PAYLOAD_DELIMITER)) {
              const delimiterIndex = fullStreamContent.indexOf(
                COMMENT_PAYLOAD_DELIMITER,
              );
              const preDelimiterContent = fullStreamContent.substring(
                0,
                delimiterIndex,
              );
              const previousDisplayedLength = accumulatedText.length;
              displayChunk = preDelimiterContent.substring(
                previousDisplayedLength,
              );
              accumulatedText = preDelimiterContent;
            } else {
              accumulatedText = fullStreamContent;
            }

            setCompletion(accumulatedText);
            if (displayChunk) {
              options?.onChunk?.(displayChunk);
            }
          }
        } else {
          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          accumulatedText = data.completion || '';
          setCompletion(accumulatedText);

          options?.onComplete?.(accumulatedText);
        }
      } catch (err) {
        // Ignore AbortError — it means the request was intentionally cancelled
        if (err instanceof DOMException && err.name === 'AbortError') {
          return accumulatedText;
        }

        const tempError = err instanceof Error ? err : new Error(String(err));
        console.error('AI completion error:', tempError.message);
        setError(tempError);

        try {
          options?.onError?.(tempError);
        } catch {
          // swallow callback errors
        }
      } finally {
        clearTimeout(timeoutId);
        if (activeControllerRef.current === controller) {
          activeControllerRef.current = null;
        }
        setIsLoading(false);
      }

      return accumulatedText;
    },
    [],
  );

  return {
    generateCompletion,
    cancel,
    completion,
    isLoading,
    error,
  };
};
