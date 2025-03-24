import { CompletionOptions } from '@hicommonwealth/shared';
import { useCallback, useState } from 'react';
import { userStore } from 'state/ui/user';

interface AiCompletionOptions extends Partial<CompletionOptions> {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

interface CompletionError {
  error: string;
  status?: number;
  metadata?: any;
}

/**
 * Hook for streaming AI completions from the server
 * Supports both OpenAI and OpenRouter
 */
export const useAiCompletion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [completion, setCompletion] = useState<string>('');

  const generateCompletion = useCallback(
    async (prompt: string, options?: AiCompletionOptions) => {
      setIsLoading(true);
      setError(null);
      setCompletion('');

      let accumulatedText = '';
      const streamMode = options?.stream !== false; // Default to true

      try {
        const response = await fetch('/api/aicompletion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            model: options?.model || 'gpt-4o',
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
            stream: streamMode,
            useOpenRouter: options?.useOpenRouter,
            jwt: userStore.getState().jwt,
          }),
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
                options?.onChunk?.(buffer);
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

            // Process and update UI immediately
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
