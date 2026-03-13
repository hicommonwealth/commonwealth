import React from 'react';
import { StickyCommentElementSelector } from '../../components/StickEditorContainer/context';
import { StickCommentProvider } from '../../components/StickEditorContainer/context/StickCommentProvider';
import { getTextFromDelta } from '../../components/react_quill_editor';
import './DiscussionsPage.scss';
import { DiscussionsPageComposer } from './DiscussionsPageComposer';
import { DiscussionsPageFeed } from './DiscussionsPageFeed';
import { DiscussionsPagePrivateTopic } from './DiscussionsPagePrivateTopic';
import { DiscussionsPageShell } from './DiscussionsPageShell';
import { HeaderWithFilters } from './HeaderWithFilters';
import { useDiscussionsData } from './useDiscussionsData';

const DiscussionsPage = () => {
  const data = useDiscussionsData();

  return (
    <StickCommentProvider mode="thread">
      <DiscussionsPageShell
        actionGroups={data.actionGroups}
        bypassGating={data.bypassGating}
        canShowGatingBanner={data.canShowGatingBanner}
        communityId={data.communityId}
        containerRef={data.containerRef}
        featuredFilter={data.featuredFilter}
        onCloseGatingBanner={() => data.setCanShowGatingBanner(false)}
        tokenBanner={data.tokenBanner}
      >
        {data.isPrivateTopicBlocked ? (
          <DiscussionsPagePrivateTopic />
        ) : (
          <>
            <HeaderWithFilters
              topic={data.topicSlug}
              stage={data.stageName}
              featuredFilter={data.featuredFilter}
              dateRange={data.dateRange}
              totalThreadCount={data.totalThreadCount}
              isIncludingSpamThreads={data.includeSpamThreads}
              onIncludeSpamThreads={data.setIncludeSpamThreads}
              isIncludingArchivedThreads={data.includeArchivedThreads}
              onIncludeArchivedThreads={data.setIncludeArchivedThreads}
              isOnArchivePage={data.isOnArchivePage}
              activeContests={data.activeContestsInTopic}
              views={data.views}
              selectedView={data.selectedView}
              setSelectedView={data.updateSelectedView}
            />

            <DiscussionsPageFeed
              actionGroups={data.actionGroups}
              bypassGating={data.bypassGating}
              communityId={data.communityId}
              containerRef={data.containerRef}
              contestsData={data.contestsData}
              featuredFilter={data.featuredFilter}
              fetchNextPage={data.fetchNextPage}
              filteredThreads={data.filteredThreads}
              hasNextPage={data.hasNextPage}
              isInitialLoading={data.isInitialLoading}
              isOnArchivePage={data.isOnArchivePage}
              topicId={data.topicId}
              timelineFilter={data.dateCursor}
              variant={data.feedVariant}
            />

            <DiscussionsPageComposer
              author={data.user.activeAccount!}
              canCreateThread={data.canCreateThread}
              communityId={data.communityId}
              contentDelta={data.threadContentDelta}
              disabled={data.isSubmitting}
              editorValue={getTextFromDelta(data.threadContentDelta)}
              handleSubmitThread={data.handleSubmitThread}
              onCancel={data.handleCancel}
              setContentDelta={data.setThreadContentDelta}
              showComposer={!!data.user.isLoggedIn && !!data.user.activeAccount}
              topic={data.topicObj}
            />

            <StickyCommentElementSelector />
          </>
        )}
      </DiscussionsPageShell>
    </StickCommentProvider>
  );
};

export default DiscussionsPage;
