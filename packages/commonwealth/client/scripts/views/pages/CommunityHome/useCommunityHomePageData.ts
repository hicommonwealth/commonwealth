import { ContentType } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type { DeltaStatic } from 'quill';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import {
  isRateLimitError,
  RATE_LIMIT_MESSAGE,
  type RateLimitErrorType,
} from 'shared/utils/rateLimit';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import useCreateThreadMutation, {
  buildCreateThreadInput,
} from 'state/api/threads/createThread';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore from 'state/ui/user';
import type { UserStoreProps } from 'state/ui/user/user';
import {
  createDeltaFromText,
  getTextFromDelta,
} from 'views/components/react_quill_editor';
// eslint-disable-next-line max-len
import { useTokenTradeWidget } from 'client/scripts/views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';

export type CommunityHomePageData = {
  activeAccount: UserStoreProps['activeAccount'];
  communityDescription: string;
  communityIdFilter: string;
  communityMemberCount: number;
  communityThreadCount: number;
  communityToken: ReturnType<typeof useTokenTradeWidget>['communityToken'];
  editorParentType: ContentType.Thread;
  handleCreateThread: (turnstileToken?: string) => Promise<number>;
  isCreatingThread: boolean;
  isLoggedIn: boolean;
  onCancelStickyEditor: () => void;
  setThreadContentDelta: Dispatch<SetStateAction<DeltaStatic>>;
  threadContentDelta: DeltaStatic;
};

const useCommunityHomePageData = (): CommunityHomePageData => {
  const user = useUserStore();
  const communityId = app.activeChainId() || '';
  const communityIdFilter = app.chain.meta.id;

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  const { data: topics } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });

  const { mutateAsync: createThread, isPending: isCreatingThread } =
    useCreateThreadMutation({ communityId });

  const { communityToken } = useTokenTradeWidget();

  const [threadContentDelta, setThreadContentDelta] = useState<DeltaStatic>(
    createDeltaFromText(''),
  );

  const handleCancelStickyEditor = () => {
    setThreadContentDelta(createDeltaFromText(''));
  };

  const handleCreateThread = async (
    turnstileToken?: string,
  ): Promise<number> => {
    if (!user.activeAccount || !community || !topics || topics.length === 0) {
      notifyError('User, community data, or topics missing.');
      return -1;
    }

    const bodyText = getTextFromDelta(threadContentDelta).trim();
    if (!bodyText) {
      notifyError('Thread body cannot be empty.');
      return -1;
    }

    const title = bodyText.split('\n')[0].substring(0, 140);
    const targetTopic = topics[0];
    const stage = 'Discussion';

    try {
      const input = await buildCreateThreadInput({
        address: user.activeAccount.address,
        kind: 'discussion',
        stage,
        communityId: community.id,
        communityBase: community.base,
        title,
        topic: targetTopic,
        body: bodyText,
        ethChainIdOrBech32Prefix:
          app.chain.meta.ChainNode?.eth_chain_id ?? undefined,
        turnstileToken,
      });

      const newThread = await createThread(input);

      if (newThread?.id) {
        notifySuccess('Thread created successfully!');
        handleCancelStickyEditor();
        return newThread.id;
      }

      throw new Error('Thread creation response missing ID.');
    } catch (error: unknown) {
      console.error('Error creating thread:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      const isRateLimitErrorShape = (
        candidate: unknown,
      ): candidate is RateLimitErrorType =>
        typeof candidate === 'object' && candidate !== null;

      if (isRateLimitErrorShape(error) && isRateLimitError(error)) {
        notifyError(RATE_LIMIT_MESSAGE);
      } else {
        notifyError(`Failed to create thread: ${errorMessage}`);
      }

      return -1;
    }
  };

  return {
    activeAccount: user.activeAccount,
    communityDescription: community?.description || '',
    communityIdFilter,
    communityMemberCount: app.chain.meta.profile_count || 0,
    communityThreadCount: community?.lifetime_thread_count || 0,
    communityToken,
    editorParentType: ContentType.Thread,
    handleCreateThread,
    isCreatingThread,
    isLoggedIn: user.isLoggedIn,
    onCancelStickyEditor: handleCancelStickyEditor,
    setThreadContentDelta,
    threadContentDelta,
  };
};

export default useCommunityHomePageData;
