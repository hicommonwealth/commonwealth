import { notifyError } from 'controllers/app/notifications';
import { createEventSource } from 'eventsource-client';
import { useRef, useState } from 'react';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { userStore } from 'state/ui/user';

type TokenIdea = {
  name: string;
  description: string;
  imageURL: string;
  symbol: string;
};

type UseGenerateTokenIdeaProps = {
  maxIdeasLimit?: number;
};

export const useGenerateTokenIdea = ({
  maxIdeasLimit = 5,
}: UseGenerateTokenIdeaProps = {}) => {
  const totalIdeasGenerated = useRef(0);
  const [activeTokenIdeaIndex, setActiveTokenIdeaIndex] = useState(0);
  const [tokenIdeas, setTokenIdeas] = useState<
    {
      chunkingField?: keyof TokenIdea;
      token?: TokenIdea;
      isChunking?: boolean;
      tokenIdeaGenerationError?: Error;
    }[]
  >([]);

  const generatedTokenIdea = tokenIdeas[activeTokenIdeaIndex];
  const isMaxTokenIdeaLimitReached =
    maxIdeasLimit === Math.max(tokenIdeas.length, activeTokenIdeaIndex + 1);

  const generateIdea = async (ideaPrompt?: string) => {
    if (maxIdeasLimit === totalIdeasGenerated.current) return;
    const ideaIndex = totalIdeasGenerated.current;
    totalIdeasGenerated.current = totalIdeasGenerated.current + 1;
    setActiveTokenIdeaIndex(ideaIndex);

    try {
      setTokenIdeas((ti) => {
        const temp = [...ti];
        temp[ideaIndex] = {
          ...(temp[ideaIndex] || {}),
          isChunking: true,
          tokenIdeaGenerationError: undefined,
        };
        return temp;
      });

      // Special case for `fetch` API usage:
      // streaming responses doesn't work with axios POST method: https://github.com/axios/axios/issues/5806
      const es = createEventSource({
        url: `${SERVER_URL}/${ApiEndpoints.GENERATE_TOKEN_IDEA}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jwt: userStore.getState().jwt,
          ideaPrompt,
          auth: true,
        }),
        fetch: fetch,
      });

      let timeoutSec = 30;
      for await (const { data, event } of es) {
        if (event === 'imageURL') {
          // we dont want imageURL to be updated in chunks
          setTokenIdeas((ti) => {
            const temp = [...ti];
            temp[ideaIndex] = {
              ...(temp[ideaIndex] || {}),
              chunkingField: undefined,
              token: {
                ...(tokenIdeas[ideaIndex]?.token || ({} as TokenIdea)),
                [event]: data,
              },
            };
            return temp;
          });

          es.close();
        } else {
          for (let i = 1; i <= data.length; i++) {
            setTimeout(() => {
              setTokenIdeas((ti) => {
                const temp = [...ti];
                temp[ideaIndex] = {
                  ...(temp[ideaIndex] || {}),
                  chunkingField: event as keyof TokenIdea,
                  token: {
                    ...(tokenIdeas[ideaIndex]?.token || ({} as TokenIdea)),
                    [event!]: data.slice(0, i),
                  },
                };
                return temp;
              });
            }, timeoutSec);

            // we want to render description chunks faster as trhey have more text
            timeoutSec += event === 'description' ? 15 : 30;
          }

          // reset chunking state after `description` is chunked
          if (event === 'description') {
            setTimeout(() => {
              setTokenIdeas((ti) => {
                const temp = [...ti];
                temp[ideaIndex] = {
                  ...(temp[ideaIndex] || {}),
                  chunkingField: undefined,
                };
                return temp;
              });
            }, timeoutSec);
          }
        }
      }
    } catch (error) {
      setTokenIdeas((ti) => {
        const temp = [...ti];
        temp[ideaIndex] = {
          ...(temp[ideaIndex] || {}),
          tokenIdeaGenerationError: error.message,
        };
        return temp;
      });
      notifyError(error.message);
      console.error('Error fetching token idea:', error.message);
    } finally {
      setTimeout(() => {
        setTokenIdeas((ti) => {
          const temp = [...ti];
          temp[ideaIndex] = {
            ...(temp[ideaIndex] || {}),
            isChunking: false,
          };
          return temp;
        });
        // Note: Sometimes the final image takes time to load and if the form is submitted during that interval
        // it sends the full image url (the one we get from chatgpt, which is non-s3) and this breaks the
        // db image col validation, which in turn breaks the api. Adding a wait of 1 sec to avoid this secnario
      }, 1000);
    }
  };

  const updateTokenIdeaByIndex = (token: TokenIdea, ideaIndex: number) => {
    // if this is the first idea/draft, count should be updated for adding
    // randomized idea generation in the next index when that is generated
    if (totalIdeasGenerated.current === 0) totalIdeasGenerated.current += 1;

    setTokenIdeas((ti) => {
      const temp = [...ti];
      temp[ideaIndex] = {
        ...(temp[ideaIndex] || {}),
        token: { ...(temp[ideaIndex]?.token || {}), ...token },
      };
      return temp;
    });
  };

  return {
    activeTokenIdeaIndex,
    setActiveTokenIdeaIndex,
    tokenIdeas,
    generateIdea,
    generatedTokenIdea,
    isMaxTokenIdeaLimitReached,
    updateTokenIdeaByIndex,
  };
};
