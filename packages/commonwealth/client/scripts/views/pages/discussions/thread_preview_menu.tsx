/* @jsx m */

import m from 'mithril';

import app from 'state';
import { navigateToSubpage } from 'app';
import { Thread, ThreadStage, Topic } from 'models';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { UpdateProposalStatusModal } from '../../modals/update_proposal_status_modal';
import { ChangeTopicModal } from '../../modals/change_topic_modal';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';

type ThreadPreviewMenuAttrs = {
  thread: Thread;
};

export class ThreadPreviewMenu
  implements m.ClassComponent<ThreadPreviewMenuAttrs>
{
  view(vnode: m.Vnode<ThreadPreviewMenuAttrs>) {
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

    return (
      <div
        class="ThreadPreviewMenu"
        onclick={(e) => {
          // prevent clicks from propagating to discussion row
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <CWPopoverMenu
          menuItems={[
            ...(hasAdminPermissions
              ? [
                  {
                    onclick: (e) => {
                      e.preventDefault();

                      app.threads
                        .pin({ proposal: thread })
                        .then(() => m.redraw());
                    },
                    label: thread.pinned ? 'Unpin thread' : 'Pin thread',
                  },
                ]
              : []),
            ...(hasAdminPermissions
              ? [
                  {
                    onclick: (e) => {
                      e.preventDefault();

                      app.threads
                        .setPrivacy({
                          threadId: thread.id,
                          readOnly: !thread.readOnly,
                        })
                        .then(() => m.redraw());
                    },
                    label: thread.readOnly ? 'Unlock thread' : 'Lock thread',
                  },
                ]
              : []),
            ...(hasAdminPermissions
              ? [
                  {
                    onclick: (e) => {
                      e.preventDefault();
                      app.modals.create({
                        modal: ChangeTopicModal,
                        data: {
                          onChangeHandler: (topic: Topic) => {
                            thread.topic = topic;
                            m.redraw();
                          },
                          thread,
                        },
                      });
                    },
                    label: 'Change topic',
                  },
                ]
              : []),
            ...(isAuthor || hasAdminPermissions
              ? [
                  {
                    onclick: (e) => {
                      e.preventDefault();
                      app.modals.create({
                        modal: UpdateProposalStatusModal,
                        data: {
                          onChangeHandler: (stage: ThreadStage) => {
                            thread.stage = stage;
                            m.redraw();
                          },
                          thread,
                        },
                      });
                    },
                    label: 'Update status',
                  },
                ]
              : []),
            ...(isAuthor || hasAdminPermissions || app.user.isSiteAdmin
              ? [
                  {
                    onclick: async (e) => {
                      e.preventDefault();

                      const carat = document.getElementsByClassName(
                        'cui-popover-trigger-active'
                      )[0] as HTMLButtonElement;

                      if (carat) carat.click();

                      const confirmed = await confirmationModalWithText(
                        'Delete this entire thread?'
                      )();

                      if (!confirmed) return;

                      app.threads.delete(thread).then(() => {
                        navigateToSubpage('/discussions');
                      });
                    },
                    label: 'Delete',
                  },
                ]
              : []),
          ]}
          trigger={<CWIconButton iconName="dotsVertical" iconSize="small" />}
        />
      </div>
    );
  }
}
