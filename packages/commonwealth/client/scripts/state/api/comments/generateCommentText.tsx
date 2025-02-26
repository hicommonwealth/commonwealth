import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { userStore } from 'state/ui/user';

export const useGenerateCommentText = () => {
  const generateComment = async (
    userText: string,
    onStreamUpdate?: (text: string, modelId?: string) => void,
    modelIds?: string[],
  ): Promise<Record<string, string>> => {
    // If no models are specified, use the default model
    const models =
      modelIds && modelIds.length > 0
        ? modelIds
        : ['anthropic/claude-3.5-sonnet'];

    const results: Record<string, string> = {};

    // Process each model in parallel
    await Promise.all(
      models.map(async (modelId) => {
        try {
          const response = await fetch(
            `${SERVER_URL}${ApiEndpoints.GENERATE_COMMENT}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userText,
                modelId,
                jwt: userStore.getState().jwt,
                auth: true,
              }),
            },
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          if (!response.body) {
            throw new Error('No response body');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedText = '';
          let lastChunk = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            try {
              let newText = '';
              try {
                const data = JSON.parse(chunk);
                if (data.error) {
                  throw new Error(data.error);
                }
                newText = data.text || data;
              } catch (jsonError) {
                newText = chunk;
              }

              if (newText && newText !== lastChunk) {
                accumulatedText = newText;
                lastChunk = newText;
                onStreamUpdate?.(accumulatedText, modelId);
              }
            } catch (error) {
              console.error('Error processing chunk:', error);
            }
          }

          results[modelId] = accumulatedText;
        } catch (error) {
          console.error(
            `Error generating comment with model ${modelId}:`,
            error,
          );
          results[modelId] =
            `Error: Could not generate with ${modelId.split('/').pop()}`;
        }
      }),
    );

    return results;
  };

  return { generateComment };
};
