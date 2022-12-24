/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
import { ListItem, Icon, Icons } from 'construct-ui';

import 'components/component_kit/cw_sidebar_menu.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { AddressInfo, ChainInfo, RoleInfo } from 'models';
import { getClasses } from './helpers';
import { CWText } from './cw_text';
import { CWIcon } from './cw_icons/cw_icon';
import { ComponentType, MenuItem } from './types';
import { CommunityLabel } from '../community_label';
import User from '../widgets/user';

// TODO: Switch to new component kit system, migrate to more native setup
const renderCommunity = (item: ChainInfo) => {
  const roles: RoleInfo[] = [];
  roles.push(...app.roles.getAllRolesInCommunity({ chain: item.id }));

  return render(ListItem, {
    class: app.communities.isStarred(item.id) ? 'starred' : '',
    label: <CommunityLabel community={item} />,
    selected: app.activeChainId() === item.id,
    onclick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      app.sidebarToggled = false;
      app.sidebarMenu = 'default';
      setRoute(item.id ? `/${item.id}` : '/');
    },
    contentRight: app.isLoggedIn() && roles.length > 0 && (
      <div
        className="community-star-toggle"
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await app.communities.setStarred(item.id);
          redraw();
        }}
      >
        {roles.map((role) => {
          // TODO: sometimes address_chain is null here -- why??
          return render(User, {
            avatarSize: 18,
            avatarOnly: true,
            user: new AddressInfo(
              role.address_id,
              role.address,
              role.address_chain || role.chain_id,
              null
            ),
          });
        })}
        <div className="star-icon">
          {render(Icon, { name: Icons.STAR, key: item.id })}
        </div>
      </div>
    ),
  });
};

class CWSidebarMenuItem extends ClassComponent<MenuItem> {
  view(vnode: ResultNode<MenuItem>) {
    if (vnode.attrs.type === 'default') {
      const { disabled, iconLeft, iconRight, isSecondary, label, onclick } =
        vnode.attrs;

      return (
        <div
          className={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
            { disabled, isSecondary },
            'SidebarMenuItem default'
          )}
          onClick={(e) => {
            if (onclick) onclick(e);
          }}
        >
          <div className="sidebar-menu-item-left">
            {iconLeft && <CWIcon iconName={iconLeft} />}
            <CWText type="b2">{label}</CWText>
          </div>
          {iconRight && <CWIcon iconName={iconRight} iconSize="small" />}
        </div>
      );
    } else if (vnode.attrs.type === 'header') {
      return (
        <div className="SidebarMenuItem header">
          <CWText type="caption">{vnode.attrs.label}</CWText>
        </div>
      );
    } else if (vnode.attrs.type === 'community') {
      return (
        <div className="SidebarMenuItem community">
          {renderCommunity(vnode.attrs.community)}
        </div>
      );
    }
  }
}

type SidebarMenuAttrs = {
  className?: string;
  menuHeader?: { label: string; onclick: (e) => void };
  menuItems: Array<MenuItem>;
};

export class CWSidebarMenu extends ClassComponent<SidebarMenuAttrs> {
  view(vnode: ResultNode<SidebarMenuAttrs>) {
    const { className, menuHeader, menuItems } = vnode.attrs;

    return (
      <div
        className={getClasses<{ className: string }>(
          { className },
          ComponentType.SidebarMenu
        )}
      >
        <div className="sidebar-top">
          {menuHeader && (
            <div className="sidebar-menu-header" onClick={menuHeader.onclick}>
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
        <div className="sidebar-bottom">
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
                setRoute('/communities');
              },
            },
            {
              type: 'default',
              label: 'Notification settings',
              iconLeft: 'person',
              onclick: () => {
                app.sidebarToggled = false;
                app.sidebarMenu = 'default';
                setRoute('/notification-settings');
              },
            },
            {
              type: 'default',
              label: 'Account settings',
              iconLeft: 'bell',
              onclick: () => {
                if (app.activeChainId()) {
                  navigateToSubpage('/settings');
                } else {
                  app.sidebarToggled = false;
                  app.sidebarMenu = 'default';
                  setRoute('/settings');
                }
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
