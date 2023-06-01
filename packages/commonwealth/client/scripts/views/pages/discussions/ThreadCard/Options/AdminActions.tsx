import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { Modal } from 'views/components/component_kit/cw_modal';
import { ChangeTopicModal } from 'views/modals/change_topic_modal';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { UpdateProposalStatusModal } from 'views/modals/update_proposal_status_modal';
import { ThreadActionType } from '../../../../../../../shared/types';
import { notifySuccess } from '../../../../../controllers/app/notifications';
import Permissions from '../../../../../utils/Permissions';
import type Thread from '../../../../../models/Thread';
import type { IThreadCollaborator } from '../../../../../models/Thread';
import Topic from '../../../../../models/Topic';
import { ThreadStage } from '../../../../../models/types';
import { CWIcon } from '../../../../components/component_kit/cw_icons/cw_icon';
import { PopoverMenu } from '../../../../components/component_kit/cw_popover/cw_popover_menu';
import { EditCollaboratorsModal } from '../../../../modals/edit_collaborators_modal';

export type AdminActionsProps = {
  thread: Thread;
  onDelete?: () => any;
  onSpamToggle?: (isSpam: boolean) => any;
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
      description: <>Delete this entire thread?</>,
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
      title: 'Confirm flag as spam',
      description: (
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
      ),
      buttons: [
        {
          label: 'Cancel',
          buttonType: 'mini-black',
        },
        {
          label: 'Confirm',
          buttonType: 'mini-red',
          onClick: async () => {
            try {
              app.threads
                .delete(thread)
                .then(() => onSpamToggle && onSpamToggle(!thread.isSpam));
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
          menuItems={[
            ...(hasAdminPermissions ||
            isThreadAuthor ||
            (isThreadCollaborator && !thread.readOnly)
              ? [
                  {
                    label: 'Edit',
                    iconLeft: 'write' as const,
                    iconLeftWeight: 'bold',
                    onClick: handleEditThread,
                  },
                  {
                    label: 'Edit collaborators',
                    iconLeft: 'write' as const,
                    iconLeftWeight: 'bold',
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
                    label: thread.pinned ? 'Unpin thread' : 'Pin thread',
                    iconLeft: 'pin' as const,
                    iconLeftWeight: 'bold',
                  },
                  {
                    onClick: handleThreadLockToggle,
                    label: thread.readOnly ? 'Unlock thread' : 'Lock thread',
                    iconLeft: thread.readOnly
                      ? ('keyLockClosed' as const)
                      : ('keyLockOpened' as const),
                    iconLeftWeight: 'bold',
                  },
                  {
                    onClick: () => setIsChangeTopicModalOpen(true),
                    label: 'Change topic',
                    iconLeft: 'filter' as const,
                    iconLeftWeight: 'bold',
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
                          iconLeftWeight: 'bold',
                          onClick: handleSnapshotProposalClick,
                        },
                      ]
                    : []),
                  ...(thread.readOnly
                    ? [
                        {
                          label: 'Snapshot proposal from thread',
                          iconLeft: 'democraticProposal' as const,
                          iconLeftWeight: 'bold',
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
                    iconLeftWeight: 'bold',
                  },
                  {
                    onClick: handleFlagMarkAsSpam,
                    label: 'Flag as spam',
                    iconLeft: 'flag' as const,
                    iconLeftWeight: 'bold',
                  },
                  {
                    onClick: handleDeleteThread,
                    label: 'Delete',
                    iconLeft: 'trash' as const,
                    iconLeftWeight: 'bold',
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
              className="thread-option-btn"
            >
              <CWIcon iconName="dots" iconSize="small" />
            </button>
          )}
        />
      </span>

      <Modal
        content={
          <ChangeTopicModal
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
