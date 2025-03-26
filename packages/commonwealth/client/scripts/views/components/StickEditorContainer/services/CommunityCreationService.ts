import { ChainBase } from '@hicommonwealth/shared';
import { notifyError } from 'controllers/app/notifications';
import { getEthChainIdOrBech32Prefix } from 'controllers/server/sessions';
import { ThreadKind, ThreadStage } from 'models/types';
import { useState } from 'react';
import { slugifyPreserveDashes } from 'shared/utils';
import { useAiCompletion } from 'state/api/ai';
import {
  generateThreadPrompt,
  generateThreadTitlePrompt,
} from 'state/api/ai/prompts';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import useCreateCommunityMutation, {
  buildCreateCommunityInput,
} from 'state/api/communities/createCommunity';
import { useCreateThreadMutation } from 'state/api/threads';
import { buildCreateThreadInput } from 'state/api/threads/createThread';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore from 'state/ui/user';
import {
  createDeltaFromText,
  serializeDelta,
} from 'views/components/react_quill_editor/utils';
import { useGenerateCommunityIdea } from '../hooks/useGenerateCommunityIdea';

export type CommunityIdeaData = {
  name: string;
  description: string;
  imageURL: string;
};

export const useCommunityCreationService = () => {
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [createdCommunityId, setCreatedCommunityId] = useState<string | null>(
    null,
  );
  const [generatingThreads, setGeneratingThreads] = useState(false);
  const [threadGenerationPromise, setThreadGenerationPromise] =
    useState<Promise<void> | null>(null);
  const [generatedThreadIds, setGeneratedThreadIds] = useState<number[]>([]);
  const user = useUserStore();
  const { mutateAsync: createCommunityMutation } = useCreateCommunityMutation();
  const { generateCompletion } = useAiCompletion();
  const {
    generateIdea,
    generatedCommunityIdea,
    isMaxCommunityIdeaLimitReached,
    activeCommunityIdeaIndex,
    setActiveCommunityIdeaIndex,
    communityIdeas,
    updateCommunityIdeaByIndex,
  } = useGenerateCommunityIdea();

  // Fetch community data after creation
  const { data: createdCommunity } = useGetCommunityByIdQuery({
    id: createdCommunityId || '',
    includeNodeInfo: true,
    enabled: !!createdCommunityId,
  });

  // Get topics for the created community
  const { data: topics = [] } = useFetchTopicsQuery({
    communityId: createdCommunityId || '',
    apiEnabled: !!createdCommunityId,
  });

  // Check if community has "General" topic
  const generalTopic = topics.find((t) => t.name.includes('General'));

  const { mutateAsync: createThread } = useCreateThreadMutation({
    communityId: createdCommunityId || '',
  });

  // Create community from idea
  const createCommunity = async (userPrompt?: string) => {
    if (!generatedCommunityIdea?.community || isCreatingCommunity) return null;

    setIsCreatingCommunity(true);

    try {
      const communityData = generatedCommunityIdea.community;

      // Create a unique slug from the community name
      const communityId = slugifyPreserveDashes(
        communityData.name.toLowerCase(),
      );

      // Set the user's active address
      const activeAddress = user.activeAccount?.address;
      if (!activeAddress) {
        notifyError('No active address found');
        return null;
      }

      // Get first chain node (assuming there is at least one)
      const firstChainNode = user.allNodes[0];
      if (!firstChainNode) {
        notifyError('No chain node found');
        return null;
      }

      // Prepare community creation payload
      user.setData({
        addressSelectorSelectedAddress: activeAddress,
      });

      const communityPayload = buildCreateCommunityInput({
        id: communityId,
        name: communityData.name,
        chainBase: ChainBase.Ethereum,
        description: communityData.description,
        iconUrl: communityData.imageURL,
        socialLinks: [],
        chainNodeId: firstChainNode.id,
      });

      // Create the community
      await createCommunityMutation(communityPayload);

      // Store the created community ID
      setCreatedCommunityId(communityId);
      return communityId;
    } catch (e) {
      console.error('Error creating community:', e);
      const errorMsg = e?.message?.toLowerCase() || '';

      if (
        errorMsg.includes('name') &&
        errorMsg.includes('already') &&
        errorMsg.includes('exists')
      ) {
        notifyError(
          'Community name already exists. Please try again with a different name.',
        );
      } else {
        notifyError('Failed to create community');
      }

      return null;
    } finally {
      setIsCreatingCommunity(false);
    }
  };

  // Generate AI thread for the community
  const generateThread = async (communityId: string, userRequest?: string) => {
    if (!generalTopic || !createdCommunity) {
      console.error('Missing required data for thread generation');
      return null;
    }

    try {
      const activeAddress = user.activeAccount?.address;
      if (!activeAddress) {
        console.error('No active address found');
        return null;
      }

      // Generate the thread content
      let threadContent = '';
      const promptContext = `This is a new community named "${createdCommunity.name}" focused on "${createdCommunity.description}"`;
      const prompt = generateThreadPrompt(promptContext);

      threadContent = await generateCompletion(prompt, {
        stream: false,
      });

      // Generate thread title
      const titlePrompt = generateThreadTitlePrompt(threadContent);
      const threadTitle = await generateCompletion(titlePrompt, {
        stream: false,
      });

      // Create the thread
      const threadDelta = createDeltaFromText(threadContent);
      const serializedDelta = serializeDelta(threadDelta);

      const threadInput = await buildCreateThreadInput({
        address: activeAddress,
        kind: ThreadKind.Discussion,
        stage: ThreadStage.Discussion,
        communityId: communityId,
        communityBase: createdCommunity.base,
        title: threadTitle,
        topic: generalTopic,
        body: serializedDelta,
        url: '',
        ethChainIdOrBech32Prefix: getEthChainIdOrBech32Prefix({
          base: createdCommunity.base,
          bech32_prefix: createdCommunity?.bech32_prefix || '',
          eth_chain_id: createdCommunity?.ChainNode?.eth_chain_id || 0,
        }),
      });

      const thread = await createThread(threadInput);
      return thread.id;
    } catch (error) {
      console.error('Error generating thread:', error);
      return null;
    }
  };

  // Generate initial threads for the community
  const generateInitialThreads = async (
    communityId: string,
    userRequest?: string,
  ) => {
    if (!communityId || generatingThreads) return;

    setGeneratingThreads(true);

    const threadPromise = async () => {
      const newThreadIds: number[] = [];

      // Generate 3 threads
      for (let i = 0; i < 3; i++) {
        try {
          const threadId = await generateThread(communityId, userRequest);
          if (threadId) {
            newThreadIds.push(threadId);
          }
        } catch (error) {
          console.error(`Error generating thread ${i + 1}:`, error);
        }
      }

      setGeneratedThreadIds(newThreadIds);
      setGeneratingThreads(false);
    };

    const promise = threadPromise();
    setThreadGenerationPromise(promise);
    return promise;
  };

  return {
    createCommunity,
    generateInitialThreads,
    generateIdea,
    generatedCommunityIdea,
    isMaxCommunityIdeaLimitReached,
    activeCommunityIdeaIndex,
    setActiveCommunityIdeaIndex,
    communityIdeas,
    updateCommunityIdeaByIndex,
    isCreatingCommunity,
    createdCommunityId,
    generatingThreads,
    generatedThreadIds,
    threadGenerationPromise,
  };
};
