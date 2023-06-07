import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { Modal } from 'views/components/component_kit/cw_modal';
import { ChangeThreadTopicModal } from 'views/modals/change_thread_topic_modal';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { UpdateProposalStatusModal } from 'views/modals/update_proposal_status_modal';
import { notifySuccess } from '../../../../../../controllers/app/notifications';
import type Thread from '../../../../../../models/Thread';
import type { IThreadCollaborator } from '../../../../../../models/Thread';
import Topic from '../../../../../../models/Topic';
import { ThreadStage } from '../../../../../../models/types';
import Permissions from '../../../../../../utils/Permissions';
import { CWIcon } from '../../../../../components/component_kit/cw_icons/cw_icon';
import { PopoverMenu } from '../../../../../components/component_kit/cw_popover/cw_popover_menu';
import { EditCollaboratorsModal } from '../../../../../modals/edit_collaborators_modal';
import './index.scss';

export type AdminActionsProps = {
  thread: Thread;
  onDelete?: () => any;
  onSpamToggle?: (thread: Thread) => any;
  onLockToggle?: (isLocked: boolean) => any;
  onPinToggle?: (isPinned: boolean) => any;
  onTopicChange?: (newTopic: Topic) => any;
  onProposalStageChange?: (newStage: ThreadStage) => any;
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
  onTopicChange,
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

  const hasAdminPermissions =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin() ||
    Permissions.isCommunityModerator();

  const isThreadAuthor = Permissions.isThreadAuthor(thread);
  const isThreadCollaborator = Permissions.isThreadCollaborator(thread);

  const handleDeleteThread = () => {
    openConfirmation({
      title: 'Delete Thread',
      description: <p>Delete this entire thread?</p>,
      buttons: [
        {
          label: 'Delete',
          buttonType: 'mini-red',
          onClick: async () => {
            try {
              app.threads.delete(thread).then(() => onDelete && onDelete());
            } catch (err) {
              console.log(err);
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'mini-black',
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
            flagged as spam are hidden from the main feed and can't be
            interacted with. For transparency, spam can still be viewed by
            community members if they choose to "Include posts flagged as spam."
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
            they choose to “Include posts flagged as spam.”
            <br />
          </p>
        </>
      ),
      buttons: [
        {
          label: 'Cancel',
          buttonType: 'mini-black',
        },
        {
          label: !thread.markedAsSpamAt ? 'Confirm' : 'Unflag as spam?',
          buttonType: 'mini-red',
          onClick: async () => {
            try {
              app.threads
                .toggleSpam(thread.id, !!thread.markedAsSpamAt)
                .then((t: Thread) => {
                  onSpamToggle && onSpamToggle(t);
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
    app.threads
      .setPrivacy({
        threadId: thread.id,
        readOnly: !thread.readOnly,
      })
      .then(() => {
        notifySuccess(thread.readOnly ? 'Unlocked!' : 'Locked!');
        onLockToggle(!thread.readOnly);
      });
  };

  const handleThreadPinToggle = () => {
    app.threads
      .pin({ proposal: thread })
      .then(() => onPinToggle && onPinToggle(!thread.pinned));
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
            buttonType: 'mini-black',
            onClick: onEditConfirm,
          },
          {
            label: 'Cancel',
            buttonType: 'mini-white',
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
    onSnapshotProposalFromThread();
    navigate(
      snapshotSpaces.length > 1
        ? '/multiple-snapshots'
        : `/snapshot/${snapshotSpaces}`
    );
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
          className="AdminActions"
          menuItems={[
            ...(hasAdminPermissions ||
            isThreadAuthor ||
            (isThreadCollaborator && !thread.readOnly)
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
                      ? ('keyLockClosed' as const)
                      : ('keyLockOpened' as const),
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
                                : `/snapshot/${snapshotSpaces}`
                            );
                          },
                        },
                      ]
                    : []),
                  {
                    onClick: () => setIsUpdateProposalStatusModalOpen(true),
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
          renderTrigger={(onclick) => (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                onclick(e);
              }}
              className="action-btn"
            >
              <CWIcon iconName="dots" iconSize="small" />
            </button>
          )}
        />
      </span>

      <Modal
        content={
          <ChangeThreadTopicModal
            onChangeHandler={onTopicChange}
            thread={thread}
            onModalClose={() => setIsChangeTopicModalOpen(false)}
          />
        }
        onClose={() => setIsChangeTopicModalOpen(false)}
        open={isChangeTopicModalOpen}
      />

      <Modal
        content={
          <UpdateProposalStatusModal
            onChangeHandler={(s) => onProposalStageChange(s)}
            thread={thread}
            onModalClose={() => setIsUpdateProposalStatusModalOpen(false)}
          />
        }
        onClose={() => setIsUpdateProposalStatusModalOpen(false)}
        open={isUpdateProposalStatusModalOpen}
      />

      <Modal
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
    </>
  );
};
