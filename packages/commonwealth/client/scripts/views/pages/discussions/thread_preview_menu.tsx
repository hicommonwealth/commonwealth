import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { redraw } from 'mithrilInterop';
import type { Thread } from 'models';
import app from 'state';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { useCommonNavigate } from 'navigation/helpers';

type ThreadPreviewMenuProps = {
  thread: Thread;
  setIsChangeTopicModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsUpdateProposalStatusModalOpen: Dispatch<SetStateAction<boolean>>;
};

export const ThreadPreviewMenu = ({
  thread,
  setIsChangeTopicModalOpen,
  setIsUpdateProposalStatusModalOpen,
}: ThreadPreviewMenuProps) => {
  const navigate = useCommonNavigate();

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
                        navigate('/discussions');
                        redraw();
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
                          readOnly: !thread.readOnly,
                        })
                        .then(() => redraw());
                    },
                    label: thread.readOnly ? 'Unlock thread' : 'Lock thread',
                    iconLeft: 'lock' as const,
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
                    onClick: async () => {
                      const confirmed = window.confirm(
                        'Delete this entire thread?'
                      );

                      if (!confirmed) return;

                      app.threads.delete(thread).then(() => {
                        navigate('/discussions');
                      });
                    },
                    label: 'Delete',
                    iconLeft: 'trash' as const,
                  },
                ]
              : []),
          ]}
          renderTrigger={(onclick) => (
            <CWIconButton
              iconName="dotsVertical"
              iconSize="small"
              onClick={onclick}
            />
          )}
        />
      </div>
    </React.Fragment>
  );
};
