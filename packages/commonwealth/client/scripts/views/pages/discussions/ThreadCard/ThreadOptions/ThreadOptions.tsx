import { pluralize } from 'helpers';
import { GetThreadActionTooltipTextResponse } from 'helpers/threads';
import Thread from 'models/Thread';
import React, { Dispatch, SetStateAction } from 'react';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { downloadDataAsFile } from 'utils/downloadDataAsFile';
import { SharePopover } from 'views/components/SharePopover';
import { ViewUpvotesDrawerTrigger } from 'views/components/UpvoteDrawer';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { ToggleThreadSubscribe } from 'views/pages/discussions/ThreadCard/ThreadOptions/ToggleThreadSubscribe';
import { AdminActions, AdminActionsProps } from './AdminActions';
import { ReactionButton } from './ReactionButton';
import './ThreadOptions.scss';

type OptionsProps = AdminActionsProps & {
  thread?: Thread;
  upvoteBtnVisible?: boolean;
  commentBtnVisible?: boolean;
  shareEndpoint?: string;
  canUpdateThread?: boolean;
  canReact?: boolean;
  canComment?: boolean;
  totalComments?: number;
  disabledActionsTooltipText?: GetThreadActionTooltipTextResponse;
  onCommentBtnClick?: () => any;
  upvoteDrawerBtnBelow?: boolean;
  hideUpvoteDrawerButton?: boolean;
  setIsUpvoteDrawerOpen?: Dispatch<SetStateAction<boolean>>;
  editingDisabled?: boolean;
};

export const ThreadOptions = ({
  thread,
  upvoteBtnVisible = false,
  commentBtnVisible = true,
  shareEndpoint,
  canUpdateThread,
  canReact = true,
  canComment = true,
  totalComments,
  onLockToggle,
  onCollaboratorsEdit,
  onDelete,
  onEditStart,
  onEditCancel,
  onEditConfirm,
  onPinToggle,
  onProposalStageChange,
  onSnapshotProposalFromThread,
  onSpamToggle,
  hasPendingEdits,
  disabledActionsTooltipText = '',
  onCommentBtnClick = () => null,
  upvoteDrawerBtnBelow,
  hideUpvoteDrawerButton = false,
  setIsUpvoteDrawerOpen,
  editingDisabled,
}: OptionsProps) => {
  const isCommunityMember = Permissions.isCommunityMember(thread.communityId);

  const handleDownloadMarkdown = () => {
    downloadDataAsFile(thread.plaintext, 'text/markdown', thread.title + '.md');
  };

  const userStore = useUserStore();

  return (
    <>
      <div className="ThreadOptions">
        <div className="options-container">
          {!hideUpvoteDrawerButton && !upvoteDrawerBtnBelow && (
            <ViewUpvotesDrawerTrigger
              onClick={(e) => {
                e.preventDefault();
                // @ts-expect-error <StrictNullChecks/>
                setIsUpvoteDrawerOpen(true);
              }}
            />
          )}

          {upvoteBtnVisible && thread && (
            <ReactionButton
              thread={thread}
              size="small"
              disabled={!canReact}
              undoUpvoteDisabled={editingDisabled}
              tooltipText={
                typeof disabledActionsTooltipText === 'function'
                  ? disabledActionsTooltipText?.('upvote')
                  : disabledActionsTooltipText
              }
            />
          )}

          {/* @ts-expect-error StrictNullChecks*/}
          {commentBtnVisible && totalComments >= 0 && (
            <CWThreadAction
              // @ts-expect-error <StrictNullChecks/>
              label={pluralize(totalComments, 'Comment')}
              action="comment"
              disabled={!canComment}
              onClick={(e) => {
                e.preventDefault();
                onCommentBtnClick();
              }}
              tooltipText={
                typeof disabledActionsTooltipText === 'function'
                  ? disabledActionsTooltipText?.('comment')
                  : disabledActionsTooltipText
              }
            />
          )}

          {/* @ts-expect-error StrictNullChecks*/}
          <SharePopover linkToShare={shareEndpoint} buttonLabel="Share" />

          {userStore.id > 0 && (
            <ToggleThreadSubscribe
              thread={thread}
              isCommunityMember={isCommunityMember}
            />
          )}

          {thread && (
            <AdminActions
              canUpdateThread={canUpdateThread}
              thread={thread}
              onLockToggle={onLockToggle}
              onCollaboratorsEdit={onCollaboratorsEdit}
              onDelete={onDelete}
              onEditStart={onEditStart}
              onEditCancel={onEditCancel}
              onEditConfirm={onEditConfirm}
              onPinToggle={onPinToggle}
              onProposalStageChange={onProposalStageChange}
              onSnapshotProposalFromThread={onSnapshotProposalFromThread}
              onSpamToggle={onSpamToggle}
              onDownloadMarkdown={handleDownloadMarkdown}
              hasPendingEdits={hasPendingEdits}
              editingDisabled={editingDisabled}
            />
          )}
        </div>
        {!hideUpvoteDrawerButton && upvoteDrawerBtnBelow && (
          <ViewUpvotesDrawerTrigger
            onClick={(e) => {
              e.preventDefault();
              // @ts-expect-error <StrictNullChecks/>
              setIsUpvoteDrawerOpen(true);
            }}
          />
        )}
      </div>
      {thread && <></>}
    </>
  );
};
