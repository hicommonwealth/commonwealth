import { SessionKeyError } from 'controllers/server/sessions';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import {
  useDeleteThreadMutation,
  useEditThreadMutation,
} from 'state/api/threads';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { ArchiveThreadModal } from 'views/modals/ArchiveThreadModal';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';
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
  hasPendingEdits?: boolean;
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

  const {
    mutateAsync: deleteThread,
    reset: resetDeleteThreadMutation,
    error: deleteThreadError,
  } = useDeleteThreadMutation({
    communityId: app.activeChainId(),
    threadId: thread.id,
    currentStage: thread.stage,
  });

  const { RevalidationModal } = useSessionRevalidationModal({
    handleClose: resetDeleteThreadMutation,
    error: deleteThreadError,
  });

  const { mutateAsync: editThread } = useEditThreadMutation({
    communityId: app.activeChainId(),
    threadId: thread.id,
    currentStage: thread.stage,
    currentTopicId: thread.topic?.id,
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
              await deleteThread({
                threadId: thread.id,
                communityId: app.activeChainId(),
                address: app.user.activeAccount.address,
              });
              onDelete?.();
            } catch (err) {
              if (err instanceof SessionKeyError) {
                return;
              }
              console.error(err?.responseJSON?.error || err?.message);
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
              await editThread({
                communityId: app.activeChainId(),
                threadId: thread.id,
                spam: isSpam,
                address: app.user?.activeAccount?.address,
              })
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

  const handleThreadLockToggle = () => {
    editThread({
      address: app.user.activeAccount.address,
      threadId: thread.id,
      readOnly: !thread.readOnly,
      communityId: app.activeChainId(),
    })
      .then(() => {
        notifySuccess(thread?.readOnly ? 'Unlocked!' : 'Locked!');
        onLockToggle(!thread?.readOnly);
      })
      .catch(() => {
        notifyError('Could not update thread read_only');
      });
  };

  const handleThreadPinToggle = () => {
    editThread({
      address: app.user.activeAccount.address,
      threadId: thread.id,
      communityId: app.activeChainId(),
      pinned: !thread.pinned,
    })
      .then(() => {
        notifySuccess(thread?.pinned ? 'Unpinned!' : 'Pinned!');
        onPinToggle && onPinToggle(!thread.pinned);
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
    const snapshotSpaces = app.chain.meta.snapshot;
    onSnapshotProposalFromThread && onSnapshotProposalFromThread();
    navigate(
      snapshotSpaces.length > 1
        ? '/multiple-snapshots'
        : `/snapshot/${snapshotSpaces}`,
    );
  };

  const handleArchiveThread = () => {
    if (thread.archivedAt === null) {
      setIsArchiveThreadModalOpen(true);
    } else {
      editThread({
        threadId: thread.id,
        communityId: app.activeChainId(),
        archived: !thread.archivedAt,
        address: app.user?.activeAccount?.address,
      })
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
            ...(thread.archivedAt === null &&
            (hasAdminPermissions ||
              isThreadAuthor ||
              (isThreadCollaborator && !thread.readOnly))
              ? [
                  {
                    label: 'Edit',
                    iconLeft: 'write' as const,
                    iconLeftWeight: 'bold' as const,
                    onClick: handleEditThread,
                  },
                  {
                    label: 'Edit collaborators',
                    iconLeft: 'write' as const,
                    iconLeftWeight: 'bold' as const,
                    onClick: () => {
                      setIsEditCollaboratorsModalOpen(true);
                    },
                  },
                ]
              : []),
            ...(hasAdminPermissions
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
            ...(isThreadAuthor || hasAdminPermissions
              ? [
                  ...(app.chain?.meta.snapshot.length
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
                            const snapshotSpaces = app.chain.meta.snapshot;
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
      {RevalidationModal}
    </>
  );
};
