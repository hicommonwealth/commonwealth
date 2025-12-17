import {
  CompletionModel,
  CompletionOptions,
  DEFAULT_COMPLETION_MODEL,
} from '@hicommonwealth/shared';
import { useCallback, useState } from 'react';
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

// Delimiter sent by backend after streaming content before JSON payload
const COMMENT_PAYLOAD_DELIMITER = '\n__COMMENT_PAYLOAD__\n';

interface AiCompletionOptions extends Partial<CompletionOptions> {
  onChunk?: (chunk: string) => void;
  onComplete?: (
    fullText: string,
    commentPayload?: Record<string, unknown>,
  ) => void;
  onError?: (error: Error) => void;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
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

  const generateCompletion = useCallback(
    async (input: AICompletionInput, options?: AiCompletionOptions) => {
      const requestId = Math.random().toString(36).substr(2, 9);
      console.log(`[${requestId}] Starting AI completion request`, {
        completionType: input.completionType,
        model: input.model || options?.model,
        stream: input.stream !== false,
      });

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

        console.log(`[${requestId}] Sending request to /api/aicompletion`, {
          bodySize: JSON.stringify(requestBody).length,
          stream: streamMode,
        });

        const response = await fetch('/api/aicompletion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log(`[${requestId}] Received response`, {
          status: response.status,
          statusText: response.statusText,
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
          console.error('API error:', errorData);
          throw new Error(errorMessage);
        }

        if (streamMode) {
          console.log(`[${requestId}] Starting streaming response processing`);

          if (!response.body) {
            throw new Error('ReadableStream not supported in this browser.');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          let chunkCount = 0;
          let fullStreamContent = '';

          while (true) {
            const { done, value } = await reader.read();
            chunkCount++;

            if (done) {
              // Check for comment payload delimiter
              let commentPayload: Record<string, unknown> | undefined;
              let displayText = fullStreamContent;

              if (fullStreamContent.includes(COMMENT_PAYLOAD_DELIMITER)) {
                const delimiterIndex = fullStreamContent.indexOf(
                  COMMENT_PAYLOAD_DELIMITER,
                );
                displayText = fullStreamContent.substring(0, delimiterIndex);
                const jsonPayload = fullStreamContent
                  .substring(delimiterIndex + COMMENT_PAYLOAD_DELIMITER.length)
                  .trim();

                try {
                  commentPayload = JSON.parse(jsonPayload);
                  console.log(`[${requestId}] Parsed comment payload`, {
                    commentId: commentPayload?.id,
                  });
                } catch (parseError) {
                  console.error(
                    `[${requestId}] Failed to parse comment payload:`,
                    parseError,
                    { jsonPayload: jsonPayload.substring(0, 100) },
                  );
                }
              }

              accumulatedText = displayText;
              setCompletion(displayText);

              console.log(`[${requestId}] Streaming completed`, {
                totalChunks: chunkCount,
                totalLength: displayText.length,
                hasCommentPayload: !!commentPayload,
              });

              try {
                await options?.onComplete?.(displayText, commentPayload);
              } catch (callbackError) {
                console.error(`[${requestId}] Error in onComplete callback:`, {
                  error:
                    callbackError instanceof Error
                      ? callbackError.message
                      : String(callbackError),
                });
                throw callbackError;
              }
              break;
            }

            const chunk = decoder.decode(value, { stream: true });

            if (chunk.startsWith('\nError:')) {
              console.error(`[${requestId}] Error chunk received:`, chunk);
              throw new Error(chunk.substring(8));
            }

            fullStreamContent += chunk;

            // Only update displayed text up to the delimiter if it appears mid-stream
            let displayChunk = chunk;
            if (fullStreamContent.includes(COMMENT_PAYLOAD_DELIMITER)) {
              const delimiterIndex = fullStreamContent.indexOf(
                COMMENT_PAYLOAD_DELIMITER,
              );
              const preDelimiterContent = fullStreamContent.substring(
                0,
                delimiterIndex,
              );
              // Calculate what portion of the current chunk should be displayed
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
        const tempError = err instanceof Error ? err : new Error(String(err));
        console.error(`[${requestId}] AI completion error:`, {
          error: tempError.message,
          stack: tempError.stack,
        });
        setError(tempError);

        try {
          options?.onError?.(tempError);
        } catch (errorCallbackErr) {
          console.error(
            `[${requestId}] Error in onError callback:`,
            errorCallbackErr,
          );
        }
      } finally {
        console.log(`[${requestId}] AI completion request finished`);
        setIsLoading(false);
      }

      return accumulatedText;
    },
    [],
  );

  return {
    generateCompletion,
    completion,
    isLoading,
    error,
  };
};
