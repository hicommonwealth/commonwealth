import { ContentType } from '@hicommonwealth/shared';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import { useFetchGlobalActivityQuery } from 'client/scripts/state/api/feeds/fetchUserActivity';
import useUserStore from 'client/scripts/state/ui/user';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { findDenominationString } from 'helpers/findDenomination';
import { useFlag } from 'hooks/useFlag';
import type { DeltaStatic } from 'quill';
import React, { useRef, useState } from 'react';
import useCreateThreadMutation, {
  buildCreateThreadInput,
} from 'state/api/threads/createThread';
import { useFetchTopicsQuery } from 'state/api/topics';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  createDeltaFromText,
  getTextFromDelta,
} from 'views/components/react_quill_editor';
import { StickyInput } from 'views/components/StickEditorContainer';
import { StickCommentProvider } from 'views/components/StickEditorContainer/context/StickCommentProvider';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import ManageCommunityStakeModal from '../../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import ActiveContestList from '../HomePage/ActiveContestList/ActiveContestList';
import TrendingThreadList from '../HomePage/TrendingThreadList/TrendingThreadList';
import XpQuestList from '../HomePage/XpQuestList/XpQuestList';
import './CommunityHomePage.scss';
import CommunityTransactions from './CommunityTransactions/CommunityTransactions';
import TokenDetails from './TokenDetails/TokenDetails';
import TokenPerformance from './TokenPerformance/TokenPerformance';
// eslint-disable-next-line max-len
import { StickyCommentElementSelector } from 'views/components/StickEditorContainer/context/StickyCommentElementSelector';
import { WithDefaultStickyComment } from 'views/components/StickEditorContainer/context/WithDefaultStickyComment';

const CommunityHome = () => {
  const user = useUserStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const xpEnabled = useFlag('xp');
  const chain = app.chain.meta.id;

  const communityId = app.activeChainId() || '';
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  const { data: topics } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });

  const { mutateAsync: createThread, isLoading: isCreatingThread } =
    useCreateThreadMutation({ communityId });

  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

  const [selectedCommunityId] = useState<string>();

  const [threadContentDelta, setThreadContentDelta] = useState<DeltaStatic>(
    createDeltaFromText(''),
  );

  const handleCancelStickyEditor = () => {
    setThreadContentDelta(createDeltaFromText(''));
  };

  const handleCreateThread = async (): Promise<number> => {
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
      });

      const newThread = await createThread(input);

      if (newThread && newThread.id) {
        notifySuccess('Thread created successfully!');
        handleCancelStickyEditor();
        return newThread.id;
      } else {
        throw new Error('Thread creation response missing ID.');
      }
    } catch (error: unknown) {
      console.error('Error creating thread:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      notifyError(`Failed to create thread: ${errorMessage}`);
      return -1;
    }
  };

  return (
    <StickCommentProvider mode="thread">
      <CWPageLayout ref={containerRef} className="CommunitiesPageLayout">
        <div className="CommunityHome">
          <div className="header-section">
            <div className="description">
              <CWText type="h1" fontWeight="semiBold">
                Community Home
              </CWText>
              <TokenDetails
                communityDescription={community?.description || ''}
                communityMemberCount={app.chain.meta.profile_count || 0}
                communityThreadCount={community?.lifetime_thread_count || 0}
              />
            </div>
          </div>
          <TokenPerformance />
          <TrendingThreadList
            query={useFetchGlobalActivityQuery}
            communityIdFilter={chain}
          />
          <ActiveContestList isCommunityHomePage />
          <CommunityTransactions />
          {xpEnabled && <XpQuestList communityIdFilter={chain} />}
          <CWModal
            size="small"
            content={
              <ManageCommunityStakeModal
                mode={modeOfManageCommunityStakeModal}
                // @ts-expect-error <StrictNullChecks/>
                onModalClose={() => setModeOfManageCommunityStakeModal(null)}
                denomination={
                  findDenominationString(selectedCommunityId || '') || 'ETH'
                }
              />
            }
            // @ts-expect-error <StrictNullChecks/>
            onClose={() => setModeOfManageCommunityStakeModal(null)}
            open={!!modeOfManageCommunityStakeModal}
          />
        </div>
        <WithDefaultStickyComment>
          {user.isLoggedIn && user.activeAccount && (
            <StickyInput
              parentType={ContentType.Thread}
              canComment={true}
              handleSubmitComment={handleCreateThread}
              errorMsg=""
              contentDelta={threadContentDelta}
              setContentDelta={setThreadContentDelta}
              disabled={isCreatingThread}
              onCancel={handleCancelStickyEditor}
              author={user.activeAccount}
              editorValue={getTextFromDelta(threadContentDelta)}
              tooltipText="Start a new discussion"
            />
          )}
        </WithDefaultStickyComment>
        <StickyCommentElementSelector />
      </CWPageLayout>
    </StickCommentProvider>
  );
};

export default CommunityHome;
