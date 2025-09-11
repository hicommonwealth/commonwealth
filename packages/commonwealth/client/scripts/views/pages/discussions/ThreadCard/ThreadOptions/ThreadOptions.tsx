import { GetThreadToken } from '@hicommonwealth/schemas';
import {
  ActionGroups,
  CanvasSignedData,
  deserializeCanvas,
  GatedActionEnum,
  verify,
} from '@hicommonwealth/shared';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { CWTooltip } from 'client/scripts/views/components/component_kit/new_designs/CWTooltip';
import { pluralize } from 'helpers';
import { formatMarketCap } from 'helpers/formatting';
import { useTokenPricing } from 'hooks/useTokenPricing';
import Thread from 'models/Thread';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { downloadDataAsFile } from 'utils/downloadDataAsFile';
import ShareButton from 'views/components/ShareButton';
import { ThreadTokenDrawerTrigger } from 'views/components/ThreadTokenDrawer';
import { ViewUpvotesDrawerTrigger } from 'views/components/UpvoteDrawer';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { ToggleThreadSubscribe } from 'views/pages/discussions/ThreadCard/ThreadOptions/ToggleThreadSubscribe';
import { z } from 'zod';
import { AdminActions, AdminActionsProps } from './AdminActions';
import { ReactionButton } from './ReactionButton';
import './ThreadOptions.scss';

type OptionsProps = AdminActionsProps & {
  thread?: Thread;
  threadToken?: z.infer<typeof GetThreadToken.output>;
  upvoteBtnVisible?: boolean;
  commentBtnVisible?: boolean;
  shareEndpoint?: string;
  canUpdateThread?: boolean;
  canReact?: boolean;
  canComment?: boolean;
  totalComments?: number;
  onCommentBtnClick?: () => any;
  upvoteDrawerBtnBelow?: boolean;
  hideUpvoteDrawerButton?: boolean;
  setIsUpvoteDrawerOpen?: Dispatch<SetStateAction<boolean>>;
  editingDisabled?: boolean;
  onCommentClick?: () => void;
  expandCommentBtnVisible?: boolean;
  showCommentVisible?: boolean;
  toggleShowComments?: () => void;
  showOnlyThreadActionIcons?: boolean;
  actionGroups: ActionGroups;
  bypassGating: boolean;
  onTradeClick?: () => void;
  onTokenDrawerClick?: () => void;
};

export const ThreadOptions = ({
  thread,
  threadToken,
  upvoteBtnVisible = false,
  commentBtnVisible = true,
  shareEndpoint,
  canUpdateThread,
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
  onCommentBtnClick = () => null,
  upvoteDrawerBtnBelow,
  hideUpvoteDrawerButton = false,
  setIsUpvoteDrawerOpen,
  editingDisabled,
  onCommentClick,
  expandCommentBtnVisible,
  showCommentVisible,
  toggleShowComments,
  showOnlyThreadActionIcons = false,
  actionGroups,
  bypassGating,
  onTradeClick,
  onTokenDrawerClick,
}: OptionsProps) => {
  const isCommunityMember = Permissions.isCommunityMember(thread.communityId);
  const userStore = useUserStore();

  const handleDownloadMarkdown = () => {
    downloadDataAsFile(thread.body, 'text/markdown', thread.title + '.md');
  };

  const permissions = Permissions.getMultipleActionsPermission({
    actions: [
      GatedActionEnum.CREATE_THREAD_REACTION,
      GatedActionEnum.CREATE_COMMENT,
    ] as const,
    thread,
    actionGroups,
    bypassGating,
  });

  const [verifiedCanvasSignedData, setVerifiedCanvasSignedData] =
    useState<CanvasSignedData | null>(null);
  useEffect(() => {
    try {
      const canvasSignedData: CanvasSignedData = deserializeCanvas(
        thread.canvasSignedData!,
      );
      if (!canvasSignedData) return;
      verify(canvasSignedData)
        .then(() => {
          setVerifiedCanvasSignedData(canvasSignedData);
        })
        .catch(() => null);
    } catch (error) {
      // ignore errors or missing data
    }
  }, [thread.canvasSignedData]);


  const { pricing: tokenPricing, isLoading: isPricingLoading } = useTokenPricing({
    token: threadToken as any, // Cast to LaunchpadToken type
  });
  const lastPurchaseActivity = thread.lastPurchaseActivity;

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
              disabled={!permissions.CREATE_THREAD_REACTION.allowed}
              undoUpvoteDisabled={editingDisabled}
              tooltipText={permissions.CREATE_THREAD_REACTION.tooltip}
            />
          )}

          {/* @ts-expect-error StrictNullChecks*/}
          {commentBtnVisible && totalComments >= 0 && (
            <CWThreadAction
              label={
                showOnlyThreadActionIcons
                  ? ''
                  : // @ts-expect-error <StrictNullChecks/>
                    pluralize(totalComments, 'Comment')
              }
              action="comment"
              disabled={!permissions.CREATE_COMMENT.allowed}
              onClick={(e) => {
                e.preventDefault();
                onCommentBtnClick();
                onCommentClick && onCommentClick();
              }}
              tooltipText={permissions.CREATE_COMMENT.tooltip}
            />
          )}

          {threadToken?.token_address && onTradeClick && (
            <CWTooltip
              placement="top"
              content={
                tokenPricing?.marketCapCurrent
                  ? `Market Cap: ${formatMarketCap(tokenPricing.marketCapCurrent)}`
                  : lastPurchaseActivity?.is_buy !== undefined
                    ? `Last trade: ${lastPurchaseActivity.is_buy ? 'Buy' : 'Sell'}`
                    : 'View market cap'
              }
              renderTrigger={(handleInteraction) => (
                <button
                  className="ThreadAction"
                  onClick={(e) => {
                    e.preventDefault();
                    onTradeClick();
                  }}
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                >
                  {lastPurchaseActivity?.is_buy !== undefined && (
                    <CWIcon
                      iconName={
                        lastPurchaseActivity.is_buy ? 'arrowUpHalfGreen' : 'arrowDownHalfOrange'
                      }
                      iconSize="small"
                    />
                  )}
                  {!showOnlyThreadActionIcons && (
                    <CWText type="caption" fontWeight="regular">
                      {isPricingLoading
                        ? 'Loading...'
                        : tokenPricing?.marketCapCurrent
                          ? formatMarketCap(tokenPricing.marketCapCurrent)
                          : 'Market Cap'}
                    </CWText>
                  )}
                </button>
              )}
            />
          )}

          {threadToken?.token_address && onTokenDrawerClick && (
            <ThreadTokenDrawerTrigger
              onClick={(e) => {
                e.preventDefault();
                onTokenDrawerClick();
              }}
              label={showOnlyThreadActionIcons ? '' : 'Holders'}
              showLabel={!showOnlyThreadActionIcons}
            />
          )}

          {shareEndpoint && (
            <ShareButton
              url={shareEndpoint}
              title={thread.title}
              text="See my thread and join me on Common"
              shareType="thread"
              buttonLabel={showOnlyThreadActionIcons ? '' : 'Share'}
            />
          )}

          {userStore.id > 0 && (
            <ToggleThreadSubscribe
              thread={thread}
              isCommunityMember={isCommunityMember}
              showLabel={!showOnlyThreadActionIcons}
            />
          )}

          {verifiedCanvasSignedData && (
            <CWText
              type="caption"
              fontWeight="medium"
              className="verification-icon"
            >
              <CWTooltip
                placement="top"
                content="Signed by author"
                renderTrigger={(handleInteraction) => (
                  <span
                    onMouseEnter={handleInteraction}
                    onMouseLeave={handleInteraction}
                  >
                    <CWIcon iconName="check" iconSize="xs" />
                  </span>
                )}
              ></CWTooltip>
            </CWText>
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
        {Boolean(thread?.numberOfComments) && expandCommentBtnVisible && (
          <CWButton
            className="latest-button"
            buttonType="tertiary"
            buttonHeight="sm"
            label={showCommentVisible ? 'Hide comments' : 'Show comments'}
            iconLeft={showCommentVisible ? 'chevronUp' : 'chevronDown'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleShowComments?.();
            }}
          />
        )}
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
