import { buildDeleteThreadInput } from 'client/scripts/state/api/threads/deleteThread';
import { buildUpdateThreadInput } from 'client/scripts/state/api/threads/editThread';
import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { SessionKeyError } from 'controllers/server/sessions';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import {
  useDeleteThreadMutation,
  useEditThreadMutation,
} from 'state/api/threads';
import useUserStore from 'state/ui/user';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { ArchiveThreadModal } from 'views/modals/ArchiveThreadModal';
import { ChangeThreadTopicModal } from 'views/modals/change_thread_topic_modal';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { UpdateProposalStatusModal } from 'views/modals/update_proposal_status_modal';
import {
  notifyError,
  notifySuccess,
} from '../../../../../../controllers/app/notifications';
import type Thread from '../../../../../../models/Thread';
import type { IThreadCollaborator } from '../../../../../../models/Thread';
import Permissions from '../../../../../../utils/Permissions';
import { EditCollaboratorsModal } from '../../../../../modals/edit_collaborators_modal';
import './AdminActions.scss';

export type AdminActionsProps = {
  thread: Thread;
  canUpdateThread?: boolean;
  onDelete?: () => any;
  onSpamToggle?: (thread: Thread) => any;
  onLockToggle?: (isLocked: boolean) => any;
  onPinToggle?: (isPinned: boolean) => any;
  onProposalStageChange?: (newStage: string) => any;
  onSnapshotProposalFromThread?: () => any;
  onCollaboratorsEdit?: (collaborators: IThreadCollaborator[]) => any;
  onEditStart?: () => any;
  onEditConfirm?: () => any;
  onEditCancel?: () => any;
  onDownloadMarkdown?: () => void;
  hasPendingEdits?: boolean;
  editingDisabled?: boolean;
};

export const AdminActions = ({
  thread,
  onDelete,
  onSpamToggle,
  onLockToggle,
  onPinToggle,
  onProposalStageChange,
  onSnapshotProposalFromThread,
  onCollaboratorsEdit,
  onEditStart,
  onEditCancel,
  onEditConfirm,
  hasPendingEdits,
  editingDisabled,
  onDownloadMarkdown,
  canUpdateThread,
}: AdminActionsProps) => {
  const navigate = useCommonNavigate();
  const [isEditCollaboratorsModalOpen, setIsEditCollaboratorsModalOpen] =
    useState(false);
  const [isChangeTopicModalOpen, setIsChangeTopicModalOpen] = useState(false);
  const [isUpdateProposalStatusModalOpen, setIsUpdateProposalStatusModalOpen] =
    useState(false);
  const [isArchiveThreadModalOpen, setIsArchiveThreadModalOpen] =
    useState(false);

  const hasAdminPermissions =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin() ||
    Permissions.isCommunityModerator();

  const isThreadAuthor = Permissions.isThreadAuthor(thread);
  const isThreadCollaborator = Permissions.isThreadCollaborator(thread);
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();
  const user = useUserStore();

  const { mutateAsync: deleteThread } = useDeleteThreadMutation(thread);

  const { mutateAsync: editThread } = useEditThreadMutation({
    communityId: app.activeChainId() || '',
    threadId: thread.id,
    threadMsgId: thread.canvasMsgId!,
    currentStage: thread.stage,
    currentTopicId: thread.topic?.id!,
  });

  const handleDeleteThread = () => {
    openConfirmation({
      title: 'Delete Thread',
      description: <p>Delete this entire thread?</p>,
      buttons: [
        {
          label: 'Delete',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              const input = await buildDeleteThreadInput(
                user.activeAccount?.address || '',
                thread,
              );
              await deleteThread(input);
              onDelete?.();
            } catch (err) {
              if (err instanceof SessionKeyError) {
                checkForSessionKeyRevalidationErrors(err);
                return;
              }
              console.error(err.message);
              notifyError('Failed to delete thread');
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'primary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  const handleFlagMarkAsSpam = () => {
    openConfirmation({
      title: !thread.markedAsSpamAt
        ? 'Confirm flag as spam'
        : 'Unflag as spam?',
      description: !thread.markedAsSpamAt ? (
        <>
          <p>Are you sure you want to flag this post as spam?</p>
          <br />
          <p>
            Flagging as spam will help filter out unwanted content. Posts
            flagged as spam are hidden from the main feed and can&apos;t be
            interacted with. For transparency, spam can still be viewed by
            community members if they choose to &quot;Include posts flagged as
            spam.&quot;
          </p>
          <br />
          <p>Note that you can always unflag a post as spam.</p>
        </>
      ) : (
        <>
          <p>
            Are you sure you want to unflag this post as spam? Flagging as spam
            will help filter out unwanted content.
          </p>
          <br />
          <p>
            For transparency, spam can still be viewed by community members if
            they choose to &quot;Include posts flagged as spam.&quot;
            <br />
          </p>
        </>
      ),
      buttons: [
        {
          label: 'Cancel',
          buttonType: 'primary',
          buttonHeight: 'sm',
        },
        {
          label: !thread.markedAsSpamAt ? 'Confirm' : 'Unflag as spam?',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            const isSpam = !thread.markedAsSpamAt;
            try {
              const input = await buildUpdateThreadInput({
                communityId: app.activeChainId() || '',
                threadId: thread.id,
                threadMsgId: thread.canvasMsgId!,
                spam: isSpam,
                address: user.activeAccount?.address || '',
              });
              await editThread(input)
                .then((t: Thread | any) => onSpamToggle && onSpamToggle(t))
                .catch(() => {
                  notifyError(
                    `Could not ${!isSpam ? 'mark' : 'unmark'} thread as spam`,
                  );
                });
            } catch (err) {
              console.log(err);
            }
          },
        },
      ],
    });
  };

  const handleThreadLockToggle = async () => {
    const input = await buildUpdateThreadInput({
      address: user.activeAccount?.address || '',
      threadId: thread.id,
      threadMsgId: thread.canvasMsgId!,
      readOnly: !thread.readOnly,
      communityId: app.activeChainId() || '',
    });
    editThread(input)
      .then(() => {
        notifySuccess(thread?.readOnly ? 'Unlocked!' : 'Locked!');
        onLockToggle?.(!thread?.readOnly);
      })
      .catch((e) => {
        console.log(e);
        notifyError('Could not update thread read_only');
      });
  };

  const handleThreadPinToggle = async () => {
    const input = await buildUpdateThreadInput({
      address: user.activeAccount?.address || '',
      threadId: thread.id,
      threadMsgId: thread.canvasMsgId!,
      communityId: app.activeChainId() || '',
      pinned: !thread.pinned,
    });
    editThread(input)
      .then(() => {
        notifySuccess(thread?.pinned ? 'Unpinned!' : 'Pinned!');
        onPinToggle?.(!thread.pinned);
      })
      .catch(() => {
        notifyError('Could not update pinned state');
      });
  };

  const handleEditThread = async (e) => {
    e.preventDefault();
    onEditStart && onEditStart();

    if (hasPendingEdits) {
      openConfirmation({
        title: 'Info',
        description: <>Previous changes found. Restore edits?</>,
        buttons: [
          {
            label: 'Restore',
            buttonType: 'primary',
            buttonHeight: 'sm',
            onClick: onEditConfirm,
          },
          {
            label: 'Cancel',
            buttonType: 'secondary',
            buttonHeight: 'sm',
            onClick: onEditCancel,
          },
        ],
      });
      return;
    }

    onEditConfirm && onEditConfirm();
  };

  const handleSnapshotProposalClick = () => {
    const snapshotSpaces = app.chain.meta?.snapshot_spaces;
    onSnapshotProposalFromThread && onSnapshotProposalFromThread();
    navigate(
      snapshotSpaces?.length > 1
        ? '/multiple-snapshots'
        : `/snapshot/${snapshotSpaces}`,
    );
  };

  const handleArchiveThread = async () => {
    if (thread.archivedAt === null) {
      setIsArchiveThreadModalOpen(true);
    } else {
      const input = await buildUpdateThreadInput({
        threadId: thread.id,
        threadMsgId: thread.canvasMsgId!,
        communityId: app.activeChainId() || '',
        archived: !thread.archivedAt,
        address: user.activeAccount?.address || '',
      });
      editThread(input)
        .then(() => {
          notifySuccess(
            `Thread has been ${
              thread?.archivedAt ? 'unarchived' : 'archived'
            }!`,
          );
        })
        .catch(() => {
          notifyError(
            `Could not ${thread?.archivedAt ? 'unarchive' : 'archive'} thread.`,
          );
        });
    }
  };

  return (
    <>
      <span
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <PopoverMenu
          className="AdminActions compact"
          menuItems={[
            ...(canUpdateThread &&
            thread.archivedAt === null &&
            (hasAdminPermissions ||
              isThreadAuthor ||
              (isThreadCollaborator && !thread.readOnly))
              ? [
                  {
                    label: 'Edit',
                    disabled: editingDisabled,
                    iconLeft: 'write' as const,
                    iconLeftWeight: 'bold' as const,
                    onClick: handleEditThread,
                  },
                  {
                    label: 'Edit collaborators',
                    disabled: editingDisabled,
                    iconLeft: 'write' as const,
                    iconLeftWeight: 'bold' as const,
                    onClick: () => {
                      setIsEditCollaboratorsModalOpen(true);
                    },
                  },
                ]
              : []),
            ...(canUpdateThread && hasAdminPermissions
              ? [
                  ...(thread.archivedAt === null
                    ? [
                        {
                          onClick: handleThreadPinToggle,
                          label: thread.pinned ? 'Unpin' : 'Pin',
                          iconLeft: 'pin' as const,
                          iconLeftWeight: 'bold' as const,
                        },
                        {
                          onClick: handleThreadLockToggle,
                          label: thread.readOnly ? 'Unlock' : 'Lock',
                          iconLeft: thread.readOnly
                            ? ('keyLockOpened' as const)
                            : ('keyLockClosed' as const),
                          iconLeftWeight: 'bold' as const,
                        },
                        {
                          onClick: () => setIsChangeTopicModalOpen(true),
                          disabled: editingDisabled,
                          label: 'Change topic',
                          iconLeft: 'filter' as const,
                          iconLeftWeight: 'bold' as const,
                        },
                      ]
                    : []),
                  {
                    label: thread.archivedAt === null ? 'Archive' : 'Unarchive',
                    iconLeft:
                      thread.archivedAt === null
                        ? ('archiveTray' as const)
                        : ('archiveTrayFilled' as const),
                    iconLeftWeight: 'bold' as const,
                    onClick: handleArchiveThread,
                  },
                ]
              : []),
            ...[
              {
                onClick: () => onDownloadMarkdown?.(),
                label: 'Download as Markdown',
                iconLeft: 'download' as const,
                iconLeftWeight: 'bold' as const,
              },
            ],
            ...(canUpdateThread && (isThreadAuthor || hasAdminPermissions)
              ? [
                  ...(app.chain?.meta?.snapshot_spaces?.length
                    ? [
                        {
                          label: 'Snapshot proposal from thread',
                          iconLeft: 'democraticProposal' as const,
                          iconLeftWeight: 'bold' as const,
                          onClick: handleSnapshotProposalClick,
                        },
                      ]
                    : []),
                  ...(thread.readOnly
                    ? [
                        {
                          label: 'Snapshot proposal from thread',
                          iconLeft: 'democraticProposal' as const,
                          iconLeftWeight: 'bold' as const,
                          onClick: () => {
                            const snapshotSpaces =
                              app?.chain?.meta?.snapshot_spaces;
                            // @ts-expect-error StrictNullChecks
                            onSnapshotProposalFromThread();
                            navigate(
                              snapshotSpaces.length > 1
                                ? '/multiple-snapshots'
                                : `/snapshot/${snapshotSpaces}`,
                            );
                          },
                        },
                      ]
                    : []),
                  ...(thread.archivedAt === null
                    ? [
                        {
                          onClick: () =>
                            setIsUpdateProposalStatusModalOpen(true),
                          label: 'Update status',
                          iconLeft: 'democraticProposal' as const,
                          iconLeftWeight: 'bold' as const,
                        },
                        {
                          onClick: handleFlagMarkAsSpam,
                          label: !thread.markedAsSpamAt
                            ? 'Flag as spam'
                            : 'Unflag as spam',
                          iconLeft: 'flag' as const,
                          iconLeftWeight: 'bold' as const,
                        },
                      ]
                    : []),
                  {
                    onClick: handleDeleteThread,
                    label: 'Delete',
                    disabled: editingDisabled,
                    iconLeft: 'trash' as const,
                    iconLeftWeight: 'bold' as const,
                    className: 'danger',
                  },
                ]
              : []),
          ]}
          renderTrigger={(onClick) => (
            <CWThreadAction action="overflow" onClick={onClick} />
          )}
        />
      </span>

      <CWModal
        size="small"
        visibleOverflow
        content={
          <ChangeThreadTopicModal
            thread={thread}
            onModalClose={() => setIsChangeTopicModalOpen(false)}
          />
        }
        onClose={() => setIsChangeTopicModalOpen(false)}
        open={isChangeTopicModalOpen}
      />

      <CWModal
        size="medium"
        visibleOverflow
        content={
          <UpdateProposalStatusModal
            onChangeHandler={(s) =>
              onProposalStageChange && onProposalStageChange(s)
            }
            thread={thread}
            onModalClose={() => setIsUpdateProposalStatusModalOpen(false)}
          />
        }
        onClose={() => setIsUpdateProposalStatusModalOpen(false)}
        open={isUpdateProposalStatusModalOpen}
      />

      <CWModal
        size="small"
        content={
          <EditCollaboratorsModal
            onModalClose={() => setIsEditCollaboratorsModalOpen(false)}
            thread={thread}
            // @ts-expect-error StrictNullChecks
            onCollaboratorsUpdated={onCollaboratorsEdit}
          />
        }
        onClose={() => setIsEditCollaboratorsModalOpen(false)}
        open={isEditCollaboratorsModalOpen}
      />

      <CWModal
        content={
          <ArchiveThreadModal
            thread={thread}
            onModalClose={() => setIsArchiveThreadModalOpen(false)}
          />
        }
        onClose={() => setIsArchiveThreadModalOpen(false)}
        open={isArchiveThreadModalOpen}
      />
    </>
  );
};
