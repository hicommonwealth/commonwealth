import { useRef, useState } from 'react';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { userStore } from 'state/ui/user';

type TokenIdea = {
  name: string;
  description: string;
  imageURL: string;
  symbol: string;
};

type StreamEnd = {
  status: 'success' | 'failure';
  message: string;
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
      const response = await fetch(
        `${SERVER_URL}/${ApiEndpoints.GENERATE_TOKEN_IDEA}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jwt: userStore.getState().jwt,
            ideaPrompt,
            auth: true,
          }),
        },
      );

      const reader = response?.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      let timeoutSec = 30;
      let chunkIndex = 1;
      const chunkIndexToFieldNameMap = {
        1: 'name',
        2: 'symbol',
        3: 'description',
        4: 'imageURL',
        5: 'imageURL',
      };

      while (true) {
        if (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value || '', { stream: true });
          const chunkJSON: StreamEnd | TokenIdea = JSON.parse(chunk);

          if ((chunkJSON as StreamEnd).status === 'failure') {
            // if this happens, usually image generation has
            // failed, we ignore that for now as its optional.
          }

          if (!(chunkJSON as StreamEnd)?.status) {
            const valueToSet = chunkJSON as TokenIdea;
            const fieldName = chunkIndexToFieldNameMap[chunkIndex];
            const fieldValue = valueToSet[fieldName];

            if (fieldName === 'imageURL') {
              // we dont want imageURL to be updated in chunks
              setTokenIdeas((ti) => {
                const temp = [...ti];
                temp[ideaIndex] = {
                  ...(temp[ideaIndex] || {}),
                  chunkingField: undefined,
                  token: {
                    ...(tokenIdeas[ideaIndex]?.token || valueToSet),
                    [fieldName]: fieldValue,
                  },
                };
                return temp;
              });
            } else {
              for (let i = 1; i <= fieldValue.length; i++) {
                setTimeout(() => {
                  setTokenIdeas((ti) => {
                    const temp = [...ti];
                    temp[ideaIndex] = {
                      ...(temp[ideaIndex] || {}),
                      chunkingField: fieldName,
                      token: {
                        ...(tokenIdeas[ideaIndex]?.token || valueToSet),
                        [fieldName]: fieldValue.slice(0, i),
                      },
                    };
                    return temp;
                  });
                }, timeoutSec);

                // we want to render description chunks faster as trhey have more text
                timeoutSec += fieldName === 'description' ? 15 : 30;
              }
            }

            chunkIndex += 1;
          }
        }
      }
    } catch (error) {
      setTokenIdeas((ti) => {
        const temp = [...ti];
        temp[ideaIndex] = {
          ...(temp[ideaIndex] || {}),
          tokenIdeaGenerationError: error,
        };
        return temp;
      });
      // handle this case properly
      console.error('Error fetching token idea:', error);
    } finally {
      setTokenIdeas((ti) => {
        const temp = [...ti];
        temp[ideaIndex] = {
          ...(temp[ideaIndex] || {}),
          isChunking: false,
        };
        return temp;
      });
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
        token,
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
