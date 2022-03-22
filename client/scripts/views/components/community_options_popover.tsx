/* @jsx m */

import m from 'mithril';
import { Icons, Icon, PopoverMenu, MenuItem } from 'construct-ui';

import app from 'state';
import { navigateToSubpage } from 'app';
import { link } from 'helpers';
import { ITokenAdapter } from 'models';
import NewTopicModal from 'views/modals/new_topic_modal';
import EditTopicThresholdsModal from 'views/modals/edit_topic_thresholds_modal';
import CreateInviteModal from 'views/modals/create_invite_modal';

export class CommunityOptionsPopover implements m.ClassComponent {
  view() {
    const isAdmin =
      app.user.isSiteAdmin ||
      app.user.isAdminOfEntity({
        chain: app.activeChainId(),
      });

    const isMod = app.user.isRoleOfCommunity({
      role: 'moderator',
      chain: app.activeChainId(),
    });

    if (!isAdmin && !isMod) return;

    return (
      <PopoverMenu
        position="bottom"
        transitionDuration={0}
        hoverCloseDelay={0}
        closeOnContentClick={true}
        trigger={<Icon name={Icons.CHEVRON_DOWN} />}
        content={[
          isAdmin && (
            <MenuItem
              label="New topic"
              onclick={(e) => {
                e.preventDefault();
                app.modals.create({ modal: NewTopicModal });
              }}
            />
          ),
          isAdmin && ITokenAdapter.instanceOf(app.chain) && (
            <MenuItem
              label="Edit topic thresholds"
              onclick={(e) => {
                e.preventDefault();
                app.modals.create({ modal: EditTopicThresholdsModal });
              }}
            />
          ),
          isAdmin && (
            <MenuItem
              label="Invite members"
              onclick={(e) => {
                e.preventDefault();
                const data = { chainInfo: app.chain.meta.chain };
                app.modals.create({
                  modal: CreateInviteModal,
                  data,
                });
              }}
            />
          ),
          isAdmin && (
            <MenuItem
              label={link(
                'a',
                `${
                  app.isCustomDomain() ? '' : `/${app.activeChainId()}`
                }/manage`,
                'Manage community'
              )}
            />
          ),
          (isAdmin || isMod) && app.activeChainId() && (
            <MenuItem
              label="Analytics"
              onclick={() => navigateToSubpage('/analytics')}
            />
          ),
        ]}
      />
    );
  }
}
