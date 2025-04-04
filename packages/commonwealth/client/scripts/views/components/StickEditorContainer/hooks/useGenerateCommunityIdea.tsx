import { notifyError } from 'controllers/app/notifications';
import { useRef, useState } from 'react';
import { useAiCompletion } from 'state/api/ai';
import { generateImage } from 'state/api/general/generateImage';

type CommunityIdea = {
  name: string;
  description: string;
  imageURL: string;
};

type UseGenerateCommunityIdeaProps = {
  maxIdeasLimit?: number;
};

export const useGenerateCommunityIdea = ({
  maxIdeasLimit = 3,
}: UseGenerateCommunityIdeaProps = {}) => {
  const { generateCompletion } = useAiCompletion();
  const totalIdeasGenerated = useRef(0);
  const [activeCommunityIdeaIndex, setActiveCommunityIdeaIndex] = useState(0);
  const [communityIdeas, setCommunityIdeas] = useState<
    {
      community?: CommunityIdea;
      isGenerating?: boolean;
      error?: Error;
    }[]
  >([]);

  const generatedCommunityIdea = communityIdeas[activeCommunityIdeaIndex];
  const isMaxCommunityIdeaLimitReached =
    maxIdeasLimit ===
    Math.max(communityIdeas.length, activeCommunityIdeaIndex + 1);

  const generateIdea = async (userPrompt?: string) => {
    if (maxIdeasLimit === totalIdeasGenerated.current) return;

    const ideaIndex = totalIdeasGenerated.current;
    totalIdeasGenerated.current = totalIdeasGenerated.current + 1;
    setActiveCommunityIdeaIndex(ideaIndex);

    try {
      setCommunityIdeas((ci) => {
        const temp = [...ci];
        temp[ideaIndex] = {
          ...(temp[ideaIndex] || {}),
          isGenerating: true,
          error: undefined,
        };
        return temp;
      });

      // Generate community name
      const namePrompt = `Generate a creative and unique name for a new online community or forum. ${
        userPrompt
          ? `It should be related to: ${userPrompt}.`
          : 'Make it catchy and memorable.'
      } The name should be concise (1-3 words) and suitable for a URL. Return only the name without any explanation or quotes.`;

      const communityName = await generateCompletion(namePrompt, {
        stream: false,
        temperature: 0.8,
      });

      // Initialize community idea with default values
      const defaultCommunityIdea: CommunityIdea = {
        name: communityName.trim() || 'New Community',
        description: '',
        imageURL: '',
      };

      // Update state with the name
      setCommunityIdeas((ci) => {
        const temp = [...ci];
        temp[ideaIndex] = {
          ...(temp[ideaIndex] || {}),
          community: {
            ...defaultCommunityIdea,
            ...(temp[ideaIndex]?.community || {}),
          },
        };
        return temp;
      });

      // Generate community description
      const descriptionPrompt = `Write a brief, engaging description for a new online community named "${communityName}". ${
        userPrompt ? `The community is about: ${userPrompt}.` : ''
      } Keep it under 150 characters. Focus on what makes this community special and what users can expect. Return only the description without any explanation or quotes.`;

      const communityDescription = await generateCompletion(descriptionPrompt, {
        stream: false,
        temperature: 0.7,
      });

      // Update state with the description
      setCommunityIdeas((ci) => {
        const temp = [...ci];
        if (temp[ideaIndex]?.community) {
          temp[ideaIndex].community = {
            ...temp[ideaIndex].community!,
            description:
              communityDescription.trim() ||
              'A community for discussion and collaboration.',
          };
        }
        return temp;
      });

      // Generate image via OpenAI
      const imagePrompt = `Generate an image for an online community or forum named "${communityName}" ${
        userPrompt ? `with a focus on: ${userPrompt}` : ''
      }. The image should be modern, professional, and suitable as a community logo or icon.`;

      const imageURL = await generateImage({ prompt: imagePrompt });

      // Update state with the image URL
      setCommunityIdeas((ci) => {
        const temp = [...ci];
        if (temp[ideaIndex]?.community) {
          temp[ideaIndex].community = {
            ...temp[ideaIndex].community!,
            imageURL: imageURL || '',
          };
        }
        return temp;
      });
    } catch (error) {
      setCommunityIdeas((ci) => {
        const temp = [...ci];
        temp[ideaIndex] = {
          ...(temp[ideaIndex] || {}),
          error: error,
        };
        return temp;
      });
      notifyError('Failed to generate community idea');
      console.error('Error generating community idea:', error);
    } finally {
      setCommunityIdeas((ci) => {
        const temp = [...ci];
        temp[ideaIndex] = {
          ...(temp[ideaIndex] || {}),
          isGenerating: false,
        };
        return temp;
      });
    }
  };

  const updateCommunityIdeaByIndex = (
    community: Partial<CommunityIdea>,
    ideaIndex: number,
  ) => {
    // if this is the first idea/draft, count should be updated for adding
    // randomized idea generation in the next index when that is generated
    if (totalIdeasGenerated.current === 0) totalIdeasGenerated.current += 1;

    setCommunityIdeas((ci) => {
      const temp = [...ci];
      if (temp[ideaIndex]?.community) {
        temp[ideaIndex].community = {
          ...temp[ideaIndex].community!,
          ...community,
        } as CommunityIdea;
      } else {
        // If no community exists yet, make sure to provide defaults for all required fields
        temp[ideaIndex] = {
          ...(temp[ideaIndex] || {}),
          community: {
            name: community.name || 'New Community',
            description:
              community.description ||
              'A community for discussion and collaboration.',
            imageURL: community.imageURL || '',
          },
        };
      }
      return temp;
    });
  };

  return {
    activeCommunityIdeaIndex,
    setActiveCommunityIdeaIndex,
    communityIdeas,
    generateIdea,
    generatedCommunityIdea,
    isMaxCommunityIdeaLimitReached,
    updateCommunityIdeaByIndex,
  };
};
