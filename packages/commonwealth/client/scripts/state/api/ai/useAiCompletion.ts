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

interface AiCompletionOptions extends Partial<CompletionOptions> {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Input for generating AI completions using entity IDs
 * Thread ID is inferred from the parent comment's thread on the server
 */
export interface AICompletionInput {
  communityId: string;
  completionType: AICompletionType;
  parentCommentId?: number;
  topicId?: number;
  model?: CompletionModel;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  useOpenRouter?: boolean;
  useWebSearch?: boolean;
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
          topicId: input.topicId,
          model: input.model || options?.model || DEFAULT_COMPLETION_MODEL,
          temperature:
            typeof input.temperature === 'number'
              ? input.temperature
              : options?.temperature,
          maxTokens: input.maxTokens || options?.maxTokens,
          stream: streamMode,
          useOpenRouter: input.useOpenRouter || options?.useOpenRouter,
          useWebSearch: input.useWebSearch || options?.useWebSearch,
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

          let buffer = '';
          let chunkCount = 0;

          while (true) {
            const { done, value } = await reader.read();
            chunkCount++;

            if (done) {
              console.log(`[${requestId}] Streaming completed`, {
                totalChunks: chunkCount,
                totalLength: accumulatedText.length,
              });

              if (buffer.length > 0) {
                accumulatedText += buffer;
                setCompletion(accumulatedText);
              }

              try {
                await options?.onComplete?.(accumulatedText);
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

            buffer += chunk;
            accumulatedText += chunk;
            setCompletion(accumulatedText);
            options?.onChunk?.(chunk);
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
