import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { userStore } from 'state/ui/user';

export const useGenerateCommentText = () => {
  const generateComment = async (
    userText: string,
    onStreamUpdate?: (text: string) => void,
  ): Promise<string> => {
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
            onStreamUpdate?.(accumulatedText);
          }
        } catch (error) {
          console.error('Error processing chunk:', error);
        }
      }

      return accumulatedText;
    } catch (error) {
      console.error('Error generating comment:', error);
      throw error;
    }
  };

  return { generateComment };
};
