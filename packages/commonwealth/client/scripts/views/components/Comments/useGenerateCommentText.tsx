import { SERVER_URL } from 'state/api/config';

export const useGenerateCommentText = () => {
  const generateComment = async (
    userText: string,
    onStreamUpdate?: (text: string) => void,
  ): Promise<string> => {
    console.log(
      'useGenerateCommentText - Starting AI generation with text:',
      userText,
    );
    return new Promise((resolve, reject) => {
      let generatedText = '';
      const eventSource = new EventSource(
        `${SERVER_URL}/api/generateCommentText`,
        {
          withCredentials: true,
        },
      );

      eventSource.addEventListener('comment', (event) => {
        try {
          const data = event.data;
          generatedText = data;
          onStreamUpdate?.(data);
          console.log('useGenerateCommentText - Received comment chunk:', data);
        } catch (error) {
          console.error(
            'useGenerateCommentText - Error processing comment event:',
            error,
          );
        }
      });

      eventSource.addEventListener('error', (event: Event) => {
        try {
          // Handle error event data if available
          if ('data' in event) {
            const data = JSON.parse((event as any).data);
            if (data.error) {
              console.error(
                'useGenerateCommentText - Server error:',
                data.error,
              );
              eventSource.close();
              reject(new Error(data.error));
              return;
            }
          }
        } catch (error) {
          console.error('useGenerateCommentText - Error event:', event);
          eventSource.close();
          reject(error);
        }
      });

      eventSource.addEventListener('open', () => {
        console.log('useGenerateCommentText - Connection opened');
        // Send the initial request
        fetch(`${SERVER_URL}/api/generateCommentText`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userText }),
          credentials: 'include',
        }).catch((error) => {
          console.error(
            'useGenerateCommentText - Failed to initiate generation:',
            error,
          );
          eventSource.close();
          reject(error);
        });
      });

      // Listen for the end of the stream
      const checkComplete = setInterval(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          clearInterval(checkComplete);
          if (generatedText) {
            console.log(
              'useGenerateCommentText - Generation complete:',
              generatedText,
            );
            resolve(generatedText);
          }
        }
      }, 100);

      // Cleanup on unmount or error
      return () => {
        clearInterval(checkComplete);
        eventSource.close();
      };
    });
  };

  return { generateComment };
};
