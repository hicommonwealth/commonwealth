import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import React, { type RefObject } from 'react';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { getTextFromDelta } from 'views/components/react_quill_editor';
import { StickyInput } from 'views/components/StickEditorContainer';
import { StickCommentProvider } from 'views/components/StickEditorContainer/context/StickCommentProvider';
// eslint-disable-next-line max-len
import { StickyCommentElementSelector } from 'views/components/StickEditorContainer/context/StickyCommentElementSelector';
import { WithDefaultStickyComment } from 'views/components/StickEditorContainer/context/WithDefaultStickyComment';
import HomeDiscoverySections from '../HomePage/HomeDiscoverySections';
import HomePageManageCommunityStakeModal from '../HomePage/HomePageManageCommunityStakeModal';
import CommunityTransactions from './CommunityTransactions/CommunityTransactions';
import TokenDetails from './TokenDetails/TokenDetails';
import TokenPerformance from './TokenPerformance/TokenPerformance';
import type { CommunityHomePageData } from './useCommunityHomePageData';

type CommunityHomePageContentProps = CommunityHomePageData & {
  containerRef: RefObject<HTMLDivElement>;
};

const CommunityHomePageContent = ({
  activeAccount,
  communityDescription,
  communityIdFilter,
  communityMemberCount,
  communityThreadCount,
  communityToken,
  containerRef,
  editorParentType,
  handleCreateThread,
  isCreatingThread,
  isLoggedIn,
  onCancelStickyEditor,
  setThreadContentDelta,
  threadContentDelta,
}: CommunityHomePageContentProps) => (
  <StickCommentProvider mode="thread">
    <CWPageLayout ref={containerRef} className="ExplorePageLayout">
      <div className="CommunityHome">
        <div className="header-section">
          <div className="description">
            <CWText type="h1" fontWeight="semiBold">
              Community Home
            </CWText>
            <TokenDetails
              communityDescription={communityDescription}
              communityMemberCount={communityMemberCount}
              communityThreadCount={communityThreadCount}
            />
          </div>
        </div>
        <TokenPerformance />
        <HomeDiscoverySections
          communityIdFilter={communityIdFilter}
          isCommunityHomePage={true}
          threadPlacement="start"
          afterPredictionMarkets={
            communityToken ? <CommunityTransactions /> : null
          }
        />
        <HomePageManageCommunityStakeModal />
      </div>
      <WithDefaultStickyComment>
        {isLoggedIn && activeAccount && (
          <StickyInput
            parentType={editorParentType}
            canComment={true}
            handleSubmitComment={handleCreateThread}
            errorMsg=""
            contentDelta={threadContentDelta}
            setContentDelta={setThreadContentDelta}
            disabled={isCreatingThread}
            onCancel={onCancelStickyEditor}
            author={activeAccount}
            editorValue={getTextFromDelta(threadContentDelta)}
            tooltipText="Start a new discussion"
          />
        )}
      </WithDefaultStickyComment>
      <StickyCommentElementSelector />
    </CWPageLayout>
  </StickCommentProvider>
);

export default CommunityHomePageContent;
