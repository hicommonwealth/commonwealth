import { extractDomain } from 'client/scripts/helpers';
import React from 'react';
import { Helmet } from 'react-helmet-async';
import app from 'state';
import ExternalLink from '../../components/ExternalLink';
import { ImageActionModal } from '../../components/ImageActionModal/ImageActionModal';
import MetaTags from '../../components/MetaTags';
import { StickCommentProvider } from '../../components/StickEditorContainer/context/StickCommentProvider';
import { CWContentPage } from '../../components/component_kit/CWContentPage';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import { CommentTree } from '../discussions/CommentTree';
import { ViewThreadPageBody } from './ViewThreadPageBody';
import { ViewThreadPageComposer } from './ViewThreadPageComposer';
import { ViewThreadPageSubBody } from './ViewThreadPageSubBody';
import type { UseViewThreadDataResult } from './useViewThreadData';
import { shouldShowViewThreadSidebar } from './viewThreadPage.contracts';
import {
  buildViewThreadProposalDetailSidebar,
  buildViewThreadSidebarComponents,
} from './viewThreadPageSidebars';

type ViewThreadPageShellProps = {
  data: UseViewThreadDataResult;
};

export const ViewThreadPageShell = ({ data }: ViewThreadPageShellProps) => {
  const sidebarComponents = buildViewThreadSidebarComponents(data);
  const proposalDetailSidebar = buildViewThreadProposalDetailSidebar(data);

  return (
    <StickCommentProvider>
      <MetaTags
        customMeta={[
          {
            name: 'title',
            content: data.ogTitle!,
          },
          {
            name: 'description',
            content: data.ogDescription!,
          },
          {
            name: 'author',
            content: data.thread?.author ?? '',
          },
          {
            name: 'twitter:card',
            content: 'summary_large_image',
          },
          {
            name: 'twitter:title',
            content: data.ogTitle!,
          },
          {
            name: 'twitter:description',
            content: data.ogDescription!,
          },
          {
            name: 'twitter:image',
            content: data.ogImageUrl,
          },
          {
            name: 'twitter:url',
            content: window.location.href,
          },
          {
            name: 'og:title',
            content: data.ogTitle!,
          },
          {
            name: 'og:description',
            content: data.ogDescription!,
          },
          {
            name: 'og:image',
            content: data.ogImageUrl,
          },
          {
            name: 'og:type',
            content: 'article',
          },
          {
            name: 'og:url',
            content: window.location.href,
          },
        ]}
      />

      <Helmet>
        <link rel="canonical" href={data.canonicalThreadUrl} />
      </Helmet>

      <CWPageLayout ref={data.pageRef}>
        <CWContentPage
          showTabs={false}
          contentBodyLabel="Thread"
          showSidebar={shouldShowViewThreadSidebar({
            isWindowSmallInclusive: data.isWindowSmallInclusive,
          })}
          onCommentClick={data.scrollToFirstComment}
          isSpamThread={!!data.thread?.markedAsSpamAt}
          title={
            data.isEditingBody ? (
              <CWTextInput
                onInput={(event) => {
                  data.handleDraftTitleChange(event.currentTarget.value);
                }}
                value={data.draftTitle}
              />
            ) : (
              data.thread?.title
            )
          }
          isEditing={data.isEditingBody}
          // @ts-expect-error <StrictNullChecks/>
          author={
            data.thread?.author
              ? app.chain.accounts.get(data.thread.author)
              : null
          }
          discord_meta={data.thread!.discord_meta!}
          collaborators={data.thread?.collaborators}
          createdAt={data.thread?.createdAt}
          updatedAt={data.thread?.updatedAt}
          lastEdited={data.thread?.lastEdited}
          viewCount={data.thread?.viewCount}
          canUpdateThread={data.canUpdateThread}
          stageLabel={!data.isStageDefault ? data.thread?.stage : undefined}
          subHeader={
            !!data.thread?.url && (
              <ExternalLink url={data.thread.url}>
                {extractDomain(data.thread.url)}
              </ExternalLink>
            )
          }
          thread={data.thread}
          onLockToggle={data.handleLockOrSpamToggle}
          onDelete={data.handleDeleteThread}
          onEditCancel={data.handleEditCancel}
          onEditConfirm={data.handleEditConfirm}
          onEditStart={data.handleEditStart}
          onSpamToggle={data.handleLockOrSpamToggle}
          hasPendingEdits={!!data.editsToSave}
          activeThreadVersionId={data.activeThreadVersionId}
          onChangeVersionHistoryNumber={data.handleVersionHistoryChange}
          threadToken={data.threadToken}
          body={(threadOptionsComp) => (
            <ViewThreadPageBody
              data={data}
              threadOptionsComp={threadOptionsComp}
            />
          )}
          subBody={
            <ViewThreadPageSubBody
              data={data}
              sidebarComponents={sidebarComponents}
            />
          }
          comments={
            <CommentTree
              pageRef={data.pageRef}
              commentsRef={data.commentsRef}
              thread={data.thread!}
              setIsGloballyEditing={data.setIsGloballyEditing}
              canComment={data.permissions.CREATE_COMMENT.allowed}
              canReact={data.permissions.CREATE_COMMENT_REACTION.allowed}
              canReply={data.permissions.CREATE_COMMENT.allowed}
              fromDiscordBot={data.fromDiscordBot}
              onThreadCreated={data.handleGenerateAIComment}
              aiCommentsToggleEnabled={!!data.effectiveAiCommentsToggleEnabled}
              streamingInstances={data.streamingInstances}
              setStreamingInstances={data.setStreamingInstances}
              permissions={data.permissions}
              onChatModeChange={data.handleChatModeChange}
            />
          }
          editingDisabled={data.isTopicInContest}
          sidebarComponents={sidebarComponents}
          proposalDetailSidebar={proposalDetailSidebar}
          showActionIcon={true}
          isChatMode={data.isChatMode}
        />
        <ViewThreadPageComposer data={data} />
      </CWPageLayout>
      {data.JoinCommunityModals}

      {data.imageActionModalOpen && (
        <ImageActionModal
          isOpen={data.imageActionModalOpen}
          onClose={() => data.setImageActionModalOpen(false)}
          onApply={() => {
            data.setImageActionModalOpen(false);
          }}
          applyButtonLabel="Add to Comment"
        />
      )}
    </StickCommentProvider>
  );
};
