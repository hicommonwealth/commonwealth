/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_sidebar_menu.scss';
import m from 'mithril';
import type { ChainInfo } from 'models';

import app from 'state';
import { CommunityLabel } from '../community_label';
import User from '../widgets/user';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import type { MenuItem } from './types';
import { ComponentType } from './types';
import { AddressAccount } from 'models';

// TODO: Switch to new component kit system, migrate to more native setup
const renderCommunity = (item: ChainInfo) => {
  const roles = app.roles.getAllRolesInCommunity({ chain: item.id });

  return (
    <div
      class={getClasses<{ isSelected: boolean }>(
        { isSelected: app.activeChainId() === item.id },
        'SidebarMenuItem community'
      )}
      onclick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        app.sidebarToggled = false;
        app.sidebarMenu = 'default';
        m.route.set(item.id ? `/${item.id}` : '/');
      }}
    >
      <CommunityLabel community={item} />
      {app.isLoggedIn() && roles.length > 0 && (
        <div class="roles-and-star">
          {m(User, {
            avatarSize: 18,
            avatarOnly: true,
            user: new AddressAccount({
              addressId: roles[0].address_id,
              address: roles[0].address,
              chain: app.config.chains.getById(
                roles[0].address_chain || roles[0].chain_id
              ),
            }),
          })}
          <div
            class={
              app.communities.isStarred(item.id) ? 'star-filled' : 'star-empty'
            }
            onclick={async (e) => {
              e.stopPropagation();
              await app.communities.setStarred(item.id);
              m.redraw();
            }}
          />
        </div>
      )}
    </div>
  );
};

class CWSidebarMenuItem extends ClassComponent<MenuItem> {
  view(vnode: m.Vnode<MenuItem>) {
    if (vnode.attrs.type === 'default') {
      const { disabled, iconLeft, iconRight, isSecondary, label, onclick } =
        vnode.attrs;

      return (
        <div
          class={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
            { disabled, isSecondary },
            'SidebarMenuItem default'
          )}
          onclick={(e) => {
            if (onclick) onclick(e);
          }}
        >
          <div class="sidebar-menu-item-left">
            {iconLeft && <CWIcon iconName={iconLeft} />}
            <CWText type="b2">{label}</CWText>
          </div>
          {iconRight && <CWIcon iconName={iconRight} iconSize="small" />}
        </div>
      );
    } else if (vnode.attrs.type === 'header') {
      return (
        <div class="SidebarMenuItem header">
          <CWText type="caption">{vnode.attrs.label}</CWText>
        </div>
      );
    } else if (vnode.attrs.type === 'community') {
      return renderCommunity(vnode.attrs.community);
    }
  }
}

type SidebarMenuAttrs = {
  className?: string;
  menuHeader?: { label: string; onclick: (e) => void };
  menuItems: Array<MenuItem>;
};

export class CWSidebarMenu extends ClassComponent<SidebarMenuAttrs> {
  view(vnode: m.Vnode<SidebarMenuAttrs>) {
    const { className, menuHeader, menuItems } = vnode.attrs;

    return (
      <div
        class={getClasses<{ className: string }>(
          { className },
          ComponentType.SidebarMenu
        )}
      >
        <div class="sidebar-top">
          {menuHeader && (
            <div class="sidebar-menu-header" onclick={menuHeader.onclick}>
              <CWIcon iconName="chevronLeft" />
              <CWText type="h5" fontWeight="medium">
                {menuHeader.label}
              </CWText>
            </div>
          )}
          {menuItems.map((item) => (
            <CWSidebarMenuItem type={item.type || 'default'} {...item} />
          ))}
        </div>
        <div class="sidebar-bottom">
          {[
            {
              type: 'header',
              label: 'Other',
            },
            {
              type: 'default',
              label: 'Explore communities',
              iconLeft: 'compass',
              onclick: () => {
                app.sidebarToggled = false;
                app.sidebarMenu = 'default';
                m.route.set('/communities');
              },
            },
            {
              type: 'default',
              label: 'Notification settings',
              iconLeft: 'person',
              onclick: () => {
                app.sidebarToggled = false;
                app.sidebarMenu = 'default';
                m.route.set('/notification-settings');
              },
            } as MenuItem,
          ].map((item: MenuItem) => {
            return (
              <CWSidebarMenuItem type={item.type || 'default'} {...item} />
            );
          })}
        </div>
      </div>
    );
  }
}
