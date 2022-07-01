/* @jsx m */

import m from 'mithril';

import { WalletId } from 'types';
import Login from 'views/components/login';
import { isWindowMediumSmallInclusive } from '../components/component_kit/helpers';
import { ProfileRowAttrs } from '../components/component_kit/cw_profiles_list';
import { LoginDesktop } from '../pages/login/login_desktop';
import { LoginMobile } from '../pages/login/login_mobile';
import { LoginBodyType, LoginSidebarType } from '../pages/login/types';

export class LoginModal implements m.ClassComponent {
  view() {
    return (
      <>
        <div class="compact-modal-title">
          <h3>Log in or create account</h3>
        </div>
        <div class="compact-modal-body">{m(Login)}</div>
      </>
    );
  }
}

const profiles = [
  { name: 'Greenpeas.eth', isSelected: true },
  { name: 'Blue-Cow.eth' },
  { name: 'Averyveryveryveryveryverylongname' },
  { name: 'Another-Name.eth' },
];

const dummyAddress = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

export class NewLoginModal implements m.ClassComponent {
  private avatarUrl: string;
  private bodyType: LoginBodyType;
  private profiles: Array<ProfileRowAttrs>;
  private sidebarType: LoginSidebarType;
  private username: string;
  private wallets: Array<string>;

  oninit() {
    this.avatarUrl = undefined;
    this.bodyType = 'allSet';
    this.profiles = profiles;
    this.sidebarType = 'newAddressLinked';
    this.username = 'elephant-blue.eth';
    this.wallets = Object.values(WalletId);
  }

  view() {
    return isWindowMediumSmallInclusive(window.innerWidth) ? (
      <LoginMobile
        address={dummyAddress}
        bodyType={this.bodyType}
        handleSetAvatar={(a) => {
          this.avatarUrl = a;
        }}
        handleSetUsername={(u) => {
          this.username = u;
        }}
        profiles={this.profiles}
        username={this.username}
        wallets={this.wallets}
      />
    ) : (
      <LoginDesktop
        address={dummyAddress}
        bodyType={this.bodyType}
        handleSetAvatar={(a) => {
          this.avatarUrl = a;
        }}
        handleSetUsername={(u) => {
          this.username = u;
        }}
        profiles={this.profiles}
        sidebarType={this.sidebarType}
        username={this.username}
        wallets={this.wallets}
      />
    );
  }
}
