import { CompletionOptions } from '@hicommonwealth/shared';
import { useCallback, useState } from 'react';
import { userStore } from 'state/ui/user';
import { useMentionExtractor } from '../../../hooks/useMentionExtractor';

interface AiCompletionOptions extends Partial<CompletionOptions> {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  // New option to include contextual mentions
  includeContextualMentions?: boolean;
  // Optional community ID for context scoping
  communityId?: string;
}

interface CompletionError {
  error: string;
  status?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}

interface ContextAggregationResponse {
  success: boolean;
  data?: {
    contextResults: Array<{
      entityType: string;
      entityId: string;
      entityName: string;
      contextData: string;
    }>;
    formattedContext: string;
    totalMentions: number;
    processedAt: string;
  };
  error?: string;
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

  const fetchContextForMentions = useCallback(
    async (
      userPrompt: string,
      communityId?: string,
    ): Promise<string | null> => {
      try {
        // Extract mentions from the user prompt
        const mentions = extractMentionsFromText(userPrompt);

        if (mentions.length === 0) {
          return null;
        }

        // Validate mention limits
        const { validMentions, hasExceededLimit } =
          validateMentionLimits(mentions);

        if (hasExceededLimit) {
          console.warn('Some mentions were ignored due to limits');
        }

        if (validMentions.length === 0) {
          return null;
        }

        // Prepare mentions for context aggregation
        const mentionsForContext = validMentions.map((mention) => ({
          id: mention.id,
          type: mention.type,
          name: mention.name,
        }));

        // Call context aggregation API
        const response = await fetch('/api/ai/aggregate-context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userStore.getState().jwt}`,
          },
          body: JSON.stringify({
            mentions: mentionsForContext,
            communityId,
            contextDataDays: 30, // Use default from config
          }),
        });

        if (!response.ok) {
          console.error(
            'Failed to fetch context for mentions:',
            response.statusText,
          );
          return null;
        }

        const contextData: ContextAggregationResponse = await response.json();

        if (!contextData.success || !contextData.data) {
          console.error('Context aggregation failed:', contextData.error);
          return null;
        }

        return contextData.data.formattedContext;
      } catch (contextError) {
        console.error('Error fetching context for mentions:', contextError);
        return null;
      }
    },
    [extractMentionsFromText, validateMentionLimits],
  );

  const generateCompletion = useCallback(
    async (userPrompt: string, options?: AiCompletionOptions) => {
      setIsLoading(true);
      setError(null);
      setCompletion('');

      let accumulatedText = '';
      const streamMode = options?.stream !== false; // Default to true

      try {
        // Fetch contextual data for mentions if enabled
        let contextualData: string | null = null;
        if (options?.includeContextualMentions !== false) {
          // Default to true
          contextualData = await fetchContextForMentions(
            userPrompt,
            options?.communityId,
          );
        }

        // Prepare enhanced system prompt with context
        let enhancedSystemPrompt = options?.systemPrompt;
        if (contextualData) {
          const contextSection = `

CONTEXTUAL INFORMATION:
The user has mentioned the following entities in their message. Use this context to provide more informed and relevant responses:

${contextualData}

---

`;
          enhancedSystemPrompt = contextSection + (enhancedSystemPrompt || '');
        }

        const requestBody: Partial<CompletionOptions> & {
          jwt?: string | null;
          prompt: string;
        } = {
          prompt: userPrompt,
          model: options?.model || 'gpt-4o',
          maxTokens: options?.maxTokens,
          stream: streamMode,
          useOpenRouter: options?.useOpenRouter,
          jwt: userStore.getState().jwt,
          ...(typeof options?.useWebSearch === 'boolean'
            ? { useWebSearch: options.useWebSearch }
            : {}),
        };

        if (typeof options?.temperature === 'number') {
          requestBody.temperature = options.temperature;
        }

        if (enhancedSystemPrompt) {
          requestBody.systemPrompt = enhancedSystemPrompt;
        }

        const response = await fetch('/api/aicompletion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
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
          if (!response.body) {
            throw new Error('ReadableStream not supported in this browser.');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Process any remaining text in the buffer
              if (buffer.length > 0) {
                accumulatedText += buffer;
                setCompletion(accumulatedText);
              }

              options?.onComplete?.(accumulatedText);
              break;
            }

            // Decode the new chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });

            // Check if the chunk contains an error message
            if (chunk.startsWith('\nError:')) {
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
        console.error('AI completion error:', tempError);
        setError(tempError);
        options?.onError?.(tempError);
      } finally {
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
