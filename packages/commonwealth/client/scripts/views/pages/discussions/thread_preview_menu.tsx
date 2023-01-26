/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import app from 'state';
import { navigateToSubpage } from 'app';
import { Thread, ThreadStage, Topic } from 'models';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { UpdateProposalStatusModal } from '../../modals/update_proposal_status_modal';
import { ChangeTopicModal } from '../../modals/change_topic_modal';
import { ReactPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';

type ThreadPreviewMenuAttrs = {
  thread: Thread;
};

export class ThreadPreviewMenu extends ClassComponent<ThreadPreviewMenuAttrs> {
  view(vnode: ResultNode<ThreadPreviewMenuAttrs>) {
    if (!app.isLoggedIn()) return;

    const { thread } = vnode.attrs;

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
      app.user.activeAccount &&
      thread.author === app.user.activeAccount.address;

    if (!isAuthor && !hasAdminPermissions) return;

    return (
      <div
        className="ThreadPreviewMenu"
        onClick={(e) => {
          // prevent clicks from propagating to discussion row
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <ReactPopoverMenu
          menuItems={[
            ...(hasAdminPermissions
              ? [
                  {
                    onClick: (e) => {
                      e.preventDefault();

                      app.threads.pin({ proposal: thread }).then(() => {
                        navigateToSubpage('/discussions');
                        this.redraw();
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
                    onClick: (e) => {
                      e.preventDefault();

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
                    onClick: (e) => {
                      e.preventDefault();
                      app.modals.create({
                        modal: ChangeTopicModal,
                        data: {
                          onChangeHandler: (topic: Topic) => {
                            thread.topic = topic;
                            redraw();
                          },
                          thread,
                        },
                      });
                    },
                    label: 'Change topic',
                    iconLeft: 'filter' as const,
                  },
                ]
              : []),
            ...(isAuthor || hasAdminPermissions
              ? [
                  {
                    onClick: (e) => {
                      e.preventDefault();
                      app.modals.create({
                        modal: UpdateProposalStatusModal,
                        data: {
                          onChangeHandler: (stage: ThreadStage) => {
                            thread.stage = stage;
                            redraw();
                          },
                          thread,
                        },
                      });
                    },
                    label: 'Update status',
                    iconLeft: 'democraticProposal' as const,
                  },
                ]
              : []),
            ...(isAuthor || hasAdminPermissions
              ? [
                  {
                    onClick: async (e) => {
                      e.preventDefault();

                      const confirmed = await confirmationModalWithText(
                        'Delete this entire thread?'
                      )();

                      if (!confirmed) return;

                      app.threads.delete(thread).then(() => {
                        navigateToSubpage('/discussions');
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
    );
  }
}
