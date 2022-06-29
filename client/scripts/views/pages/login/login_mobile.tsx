/* @jsx m */

import m from 'mithril';

import 'pages/login/login_mobile.scss';

import { ModalExitButton } from '../../components/component_kit/cw_modal';
import { CWWalletsList } from '../../components/component_kit/cw_wallets_list';
import { LoginAttrs } from '../../modals/login_modal';
import { LoginBoilerplate } from './login_boilerplate';
import { LoginText } from './login_text';

export class LoginMobile implements m.ClassComponent<LoginAttrs> {
  view(vnode) {
    const {
      address,
      bodyType,
      handleSetAvatar,
      handleSetUsername,
      profiles,
      sidebarType,
      username,
      wallets,
    } = vnode.attrs;

    return (
      <div class="LoginMobile">
        <ModalExitButton iconButtonTheme="hasBackground" />
        <div class="medium-small-container">
          <LoginText
            bodyText={`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
                imperdiet velit fringilla lorem et. Integer accumsan lobortis
                cursus amet. Dictum sit morbi elementum.`}
            headerText="Connect Your Wallet"
            isMobile
            className="bottom-margin"
          />
          <CWWalletsList
            connectAnotherWayOnclick={() => {
              // this.sidebarType = 'ethWallet';
              // this.bodyType = 'connectWithEmail';
            }}
            isMobile
            wallets={wallets}
          />
          <LoginBoilerplate />
        </div>
      </div>
    );
  }
}
