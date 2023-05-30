import { Dispatch, SetStateAction, useState } from 'react';
import React from 'react';

import type Thread from '../../../models/Thread';
import app from 'state';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { notifySuccess } from '../../../controllers/app/notifications';
import { ThreadActionType } from '../../../../../shared/types';
import { openConfirmation } from 'views/modals/confirmation_modal';

type ThreadPreviewMenuProps = {
  thread: Thread;
  setIsChangeTopicModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsUpdateProposalStatusModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsLocked: Dispatch<SetStateAction<boolean>>;
};

export const ThreadPreviewMenu = ({
  thread,
  setIsChangeTopicModalOpen,
  setIsUpdateProposalStatusModalOpen,
  setIsLocked,
}: ThreadPreviewMenuProps) => {
  const [isReadOnly, setIsReadOnly] = useState(thread.readOnly);

  const hasAdminPermissions =
    app.user.activeAccount &&
    (app.roles.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
    }) ||
      app.roles.isRoleOfCommunity({
        role: 'moderator',
        chain: app.activeChainId(),
      }));

  const isAuthor =
    app.user.activeAccount && thread.author === app.user.activeAccount.address;

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
              app.threads.delete(thread).then(() => {
                app.threadUpdateEmitter.emit('threadUpdated', {
                  threadId: thread.id,
                  action: ThreadActionType.Deletion,
                });
              });
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
              app.threads.delete(thread).then(() => {
                app.threadUpdateEmitter.emit('threadUpdated', {
                  threadId: thread.id,
                  action: ThreadActionType.Deletion,
                });
              });
            } catch (err) {
              console.log(err);
            }
          },
        },
      ],
    });
  };

  return (
    <React.Fragment>
      <div
        className="ThreadPreviewMenu"
        onClick={(e) => {
          // prevent clicks from propagating to discussion row
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <PopoverMenu
          menuItems={[
            ...(hasAdminPermissions
              ? [
                  {
                    onClick: () => {
                      app.threads.pin({ proposal: thread }).then(() => {
                        app.threadUpdateEmitter.emit('threadUpdated', {
                          threadId: thread.id,
                          action: ThreadActionType.Pinning,
                        });
                      });
                    },
                    label: thread.pinned ? 'Unpin thread' : 'Pin thread',
                    iconLeft: 'pin' as const,
                  },
                ]
              : []),
            ...(hasAdminPermissions
              ? [
                  {
                    onClick: () => {
                      app.threads
                        .setPrivacy({
                          threadId: thread.id,
                          readOnly: !isReadOnly,
                        })
                        .then(() => {
                          setIsLocked(!isReadOnly);
                          setIsReadOnly(!isReadOnly);
                          notifySuccess(isReadOnly ? 'Unlocked!' : 'Locked!');
                        });
                    },
                    label: isReadOnly ? 'Unlock thread' : 'Lock thread',
                    iconLeft: isReadOnly
                      ? ('keyLockClosed' as const)
                      : ('keyLockOpened' as const),
                  },
                ]
              : []),
            ...(hasAdminPermissions
              ? [
                  {
                    onClick: () => setIsChangeTopicModalOpen(true),
                    label: 'Change topic',
                    iconLeft: 'filter' as const,
                  },
                ]
              : []),
            ...(isAuthor || hasAdminPermissions
              ? [
                  {
                    onClick: () => {
                      setIsUpdateProposalStatusModalOpen(true);
                    },
                    label: 'Update status',
                    iconLeft: 'democraticProposal' as const,
                  },
                ]
              : []),
            ...(isAuthor || hasAdminPermissions
              ? [
                  {
                    onClick: handleFlagMarkAsSpam,
                    label: 'Flag as spam',
                    iconLeft: 'flag' as const,
                  },
                ]
              : []),
            ...(isAuthor || hasAdminPermissions
              ? [
                  {
                    onClick: handleDeleteThread,
                    label: 'Delete',
                    iconLeft: 'trash' as const,
                  },
                ]
              : []),
          ]}
          renderTrigger={(onclick) => (
            <button onClick={onclick} className="content-footer-btn">
              <CWIcon iconName="dots" iconSize="small" />
            </button>
          )}
        />
      </div>
    </React.Fragment>
  );
};
