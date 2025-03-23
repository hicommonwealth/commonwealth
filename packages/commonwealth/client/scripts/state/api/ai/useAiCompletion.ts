import { useCallback, useState } from 'react';
import { userStore } from 'state/ui/user';

type CompletionModel = 'gpt-4' | 'anthropic/claude-3.5-sonnet';

interface AiCompletionOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  model?: CompletionModel;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

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
            model: options?.model,
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
            stream: streamMode,
            jwt: userStore.getState().jwt,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Server responded with ${response.status}: ${response.statusText}`,
          );
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
            buffer += chunk;

            // Process and update UI immediately
            accumulatedText += chunk;
            setCompletion(accumulatedText);
            options?.onChunk?.(chunk);
          }
        } else {
          // Handle non-streaming response
          const data = await response.json();
          accumulatedText = data.completion || '';
          setCompletion(accumulatedText);
          options?.onComplete?.(accumulatedText);
        }
      } catch (err) {
        const tempError = err instanceof Error ? err : new Error(String(err));
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
