/* @jsx m */

import m from 'mithril';
import { Button, PopoverMenu, Icon, Icons } from 'construct-ui';

import 'mobile/mobile_header.scss';

import app from 'state';
import { NotificationsMenu } from 'views/components/header/notifications_menu';
import { SearchBar } from 'views/components/search_bar';
import { MobileSidebar } from './mobile_sidebar';
import { CustomHamburgerIcon } from './mobile_icons';
import { InvitesMenu } from '../components/header/invites_menu';

export class MobileHeader implements m.ClassComponent {
  private sidebarOpen: boolean;

  oninit() {
    this.sidebarOpen = false;
  }

  view() {
    // Because onclick never happens when logging out we must set manually
    return (
      <div class="MobileHeader">
        <img
          class="mobile-logo"
          src="https://commonwealth.im/static/img/logo.png"
          onclick={() => {
            m.route.set('/');
          }}
        />
        <SearchBar />
        <div class="mobile-header-right">
          {app.isLoggedIn() && <NotificationsMenu small={false} />}
          {app.isLoggedIn() && <InvitesMenu />}
          <PopoverMenu
            class="MobileHeaderPopoverMenu"
            transitionDuration={0}
            closeOnContentClick={true}
            closeOnOutsideClick={true}
            onClosed={() => {
              this.sidebarOpen = false;
              m.redraw();
            }}
            trigger={
              <Button
                class="mobile-popover-trigger"
                compact={true}
                label={
                  this.sidebarOpen ? (
                    <Icon name={Icons.X} />
                  ) : (
                    m(CustomHamburgerIcon)
                  )
                }
                onclick={() => {
                  this.sidebarOpen = !this.sidebarOpen;
                }}
              />
            }
            content={<MobileSidebar />}
          />
        </div>
      </div>
    );
  }
}
