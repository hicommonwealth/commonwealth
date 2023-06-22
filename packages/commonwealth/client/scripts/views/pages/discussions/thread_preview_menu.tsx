import { Dispatch, SetStateAction, useState } from 'react';
import React from 'react';

import type Thread from '../../../models/Thread';
import app from 'state';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { notifySuccess } from '../../../controllers/app/notifications';
import { ThreadActionType } from '../../../../../shared/types';
import { openConfirmation } from 'views/modals/confirmation_modal';
import moment from 'moment';

type ThreadPreviewMenuProps = {
  thread: Thread;
  setIsChangeTopicModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsUpdateProposalStatusModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsArchiveModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsLocked: Dispatch<SetStateAction<boolean>>;
  archivedAt: moment.Moment | null;
};

export const ThreadPreviewMenu = ({
  thread,
  setIsChangeTopicModalOpen,
  setIsUpdateProposalStatusModalOpen,
  setIsArchiveModalOpen,
  setIsLocked,
  archivedAt,
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
                    disabled: archivedAt ? true : false,
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
                    iconLeft: 'lock' as const,
                    disabled: archivedAt ? true : false,
                  },
                ]
              : []),
              ...(hasAdminPermissions
                ? [
                    {
                      onClick: () => setIsArchiveModalOpen(true),
                      label: archivedAt ? 'Unarchive' : 'Archive',
                      iconLeft: 'archiveTray' as const,
                    },
                  ]
                : []),
            ...(hasAdminPermissions
              ? [
                  {
                    onClick: () => setIsChangeTopicModalOpen(true),
                    label: 'Change topic',
                    iconLeft: 'filter' as const,
                    disabled: archivedAt ? true : false
                  },
                ]
              : []),
            ...((isAuthor || hasAdminPermissions)
              ? [
                  {
                    onClick: () => {
                      setIsUpdateProposalStatusModalOpen(true);
                    },
                    label: 'Update status',
                    iconLeft: 'democraticProposal' as const,
                    disabled: archivedAt ? true : false
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
            <CWIconButton
              iconName="dotsHorizontal"
              iconSize="small"
              onClick={onclick}
            />
          )}
        />
      </div>
    </React.Fragment>
  );
};
