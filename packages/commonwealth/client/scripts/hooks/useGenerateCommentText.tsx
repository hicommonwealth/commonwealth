import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { userStore } from 'state/ui/user';

export const useGenerateCommentText = () => {
  const generateComment = async (
    userText: string,
    onStreamUpdate?: (text: string) => void,
  ): Promise<string> => {
    console.log(
      'useGenerateCommentText - Starting AI generation with text:',
      userText,
    );

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
            jwt: userStore.getState().jwt,
            auth: true,
          }),
        },
      );

      if (!response.ok) {
        console.error('API request failed:', {
          status: response.status,
          statusText: response.statusText,
        });
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
        console.log('Raw chunk received:', {
          chunk,
          length: chunk.length,
          lastChunkLength: lastChunk.length,
        });

        try {
          // Try to parse as JSON first
          let newText = '';
          try {
            const data = JSON.parse(chunk);
            if (data.error) {
              console.error('Server returned error:', data.error);
              throw new Error(data.error);
            }
            newText = data.text || data;
          } catch (jsonError) {
            // If JSON parsing fails, use the raw chunk without trimming
            newText = chunk;
          }

          // Only add the chunk if it's new
          if (newText && newText !== lastChunk) {
            console.log('New text chunk:', {
              newText,
              length: newText.length,
              isNewChunk: newText !== lastChunk,
            });
            accumulatedText = newText;
            lastChunk = newText;
            onStreamUpdate?.(accumulatedText);
          } else {
            console.log('Skipping duplicate chunk');
          }
        } catch (error) {
          console.error('Error processing chunk:', {
            error,
            chunk,
            chunkLength: chunk.length,
          });
        }
      }

      console.log('Generation complete:', {
        finalText: accumulatedText,
        length: accumulatedText.length,
      });
      return accumulatedText;
    } catch (error) {
      console.error('useGenerateCommentText - Error:', error);
      throw error;
    }
  };

  return { generateComment };
};
