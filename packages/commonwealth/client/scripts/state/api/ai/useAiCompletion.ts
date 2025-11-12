import {
  CompletionOptions,
  DEFAULT_COMPLETION_MODEL,
} from '@hicommonwealth/shared';
import { notifyInfo } from 'client/scripts/controllers/app/notifications';
import { useCallback, useState } from 'react';
import { userStore } from 'state/ui/user';
import { trpc } from 'utils/trpcClient';
import { useMentionExtractor } from '../../../hooks/useMentionExtractor';

interface AiCompletionOptions extends Partial<CompletionOptions> {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  includeContextualMentions?: boolean;
  communityId?: string;
}

interface CompletionError {
  error: string;
  status?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}

/**
 * Hook for streaming AI completions from the server
 * Supports both OpenAI and OpenRouter with contextual mention integration
 */
export const useAiCompletion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [completion, setCompletion] = useState<string>('');

  const { extractMentionsFromText, validateMentionLimits } =
    useMentionExtractor();

  const utils = trpc.useUtils();

  const fetchContextForMentions = useCallback(
    async (
      userPrompt: string,
      communityId?: string,
    ): Promise<string | null> => {
      try {
        const mentions = extractMentionsFromText(userPrompt);

        if (mentions.length === 0) {
          return null;
        }

        const { validMentions, hasExceededLimit } =
          validateMentionLimits(mentions);

        if (hasExceededLimit) {
          console.warn('Some mentions were ignored due to limits');
          notifyInfo('Some mentions were ignored due to limits');
        }

        if (validMentions.length === 0) {
          return null;
        }

        const mentionsForContext = validMentions.map((mention) => ({
          id: mention.id,
          type: mention.type,
          name: mention.name,
        }));

        const contextData = await utils.search.aggregateContext.fetch({
          mentions: JSON.stringify(mentionsForContext),
          communityId,
          contextDataDays: 30,
        });

        return contextData.formattedContext;
      } catch (contextError) {
        console.error('Error fetching context for mentions:', contextError);
        return null;
      }
    },
    [extractMentionsFromText, validateMentionLimits, utils],
  );

  const generateCompletion = useCallback(
    async (userPrompt: string, options?: AiCompletionOptions) => {
      const requestId = Math.random().toString(36).substr(2, 9);
      console.log(`[${requestId}] Starting AI completion request`, {
        promptLength: userPrompt.length,
        model: options?.model,
        stream: options?.stream !== false,
      });

      setIsLoading(true);
      setError(null);
      setCompletion('');

      let accumulatedText = '';
      const streamMode = options?.stream !== false;

      try {
        let contextualData: string | null = null;
        if (options?.includeContextualMentions !== false) {
          contextualData = await fetchContextForMentions(
            userPrompt,
            options?.communityId,
          );
        }

        let enhancedSystemPrompt = options?.systemPrompt;
        if (contextualData) {
          const contextSection = `

CONTEXTUAL INFORMATION:
The user has mentioned the following entities in their message.
Use this context to provide more informed and relevant responses:

${contextualData}

---

`;
          enhancedSystemPrompt = contextSection + (enhancedSystemPrompt || '');
        }

        const requestBody: Partial<CompletionOptions> & {
          jwt?: string | null;
          prompt: string;
          communityId?: string;
        } = {
          prompt: userPrompt,
          model: options?.model || DEFAULT_COMPLETION_MODEL,
          maxTokens: options?.maxTokens,
          stream: streamMode,
          useOpenRouter: options?.useOpenRouter,
          jwt: userStore.getState().jwt,
          ...(typeof options?.useWebSearch === 'boolean'
            ? { useWebSearch: options.useWebSearch }
            : {}),
          ...(options?.communityId && { communityId: options.communityId }),
        };

        if (typeof options?.temperature === 'number') {
          requestBody.temperature = options.temperature;
        }

        if (enhancedSystemPrompt) {
          requestBody.systemPrompt = enhancedSystemPrompt;
        }

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
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (!response.ok) {
          // Try to parse the error response
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

        // Handle streaming vs. non-streaming response
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
                bufferRemaining: buffer.length,
              });

              // Process any remaining text in the buffer
              if (buffer.length > 0) {
                accumulatedText += buffer;
                setCompletion(accumulatedText);
              }

              console.log(
                `[${requestId}] Calling onComplete callback with ${accumulatedText.length} characters`,
              );
              try {
                await options?.onComplete?.(accumulatedText);
                console.log(
                  `[${requestId}] onComplete callback finished successfully`,
                );
              } catch (callbackError) {
                console.error(`[${requestId}] Error in onComplete callback:`, {
                  error:
                    callbackError instanceof Error
                      ? callbackError.message
                      : String(callbackError),
                  stack:
                    callbackError instanceof Error
                      ? callbackError.stack
                      : undefined,
                });
                // Re-throw to be caught by outer catch
                throw callbackError;
              }
              break;
            }

            // Decode the new chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });

            if (chunkCount % 10 === 0) {
              console.log(`[${requestId}] Processing chunk ${chunkCount}`, {
                chunkSize: chunk.length,
                totalAccumulated: accumulatedText.length,
              });
            }

            // Check if the chunk contains an error message
            if (chunk.startsWith('\nError:')) {
              console.error(`[${requestId}] Error chunk received:`, chunk);
              throw new Error(chunk.substring(8));
            }

            buffer += chunk;

            // Process chunk - only send the current chunk to onChunk, not the accumulated text
            accumulatedText += chunk;
            setCompletion(accumulatedText);
            options?.onChunk?.(chunk);
          }
        } else {
          // Handle non-streaming response
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
          name: tempError.name,
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
    [fetchContextForMentions],
  );

  return {
    generateCompletion,
    completion,
    isLoading,
    error,
  };
};
