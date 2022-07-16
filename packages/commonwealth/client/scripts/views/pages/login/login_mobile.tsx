/* @jsx m */

import m from 'mithril';

import 'pages/login/login_mobile.scss';

import { CWAccountCreationButton } from '../../components/component_kit/cw_account_creation_button';
import { CWAddress } from '../../components/component_kit/cw_address';
import { CWAvatarUsernameInput } from '../../components/component_kit/cw_avatar_username_input';
import { CWButton } from '../../components/component_kit/cw_button';
import { ModalExitButton } from '../../components/component_kit/cw_modal';
import {
  CWProfileRow,
  CWProfilesList,
} from '../../components/component_kit/cw_profiles_list';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWWalletsList } from '../../components/component_kit/cw_wallets_list';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { getText } from './helpers';
import { LoginBoilerplate } from './login_boilerplate';
import { LoginEthAlert } from './login_eth_alert';
import { LoginText } from './login_text';
import { LoginAttrs } from './types';

export class LoginMobile implements m.ClassComponent<LoginAttrs> {
  view(vnode) {
    const {
      address,
      bodyType,
      handleSetAvatar,
      handleSetUsername,
      profiles,
      username,
      wallets,
    } = vnode.attrs;

    const hasEthAlert =
      bodyType === 'connectWithEmail' || bodyType === 'ethWalletList';

    const hasBoilerplate =
      bodyType === 'walletList' ||
      bodyType === 'connectWithEmail' ||
      bodyType === 'ethWalletList';

    const hasCreationButtons =
      bodyType === 'selectAccountType' ||
      bodyType === 'selectPrevious' ||
      bodyType === 'welcome';

    const hasWalletList =
      bodyType === 'walletList' ||
      bodyType === 'selectPrevious' ||
      bodyType === 'ethWalletList';

    const { headerText, bodyText } = getText(bodyType);

    return (
      <div class="LoginMobile">
        <ModalExitButton iconButtonTheme="hasBackground" />
        {hasEthAlert && <LoginEthAlert />}
        <div class={bodyType}>
          <LoginText headerText={headerText} bodyText={bodyText} isMobile />
          {hasCreationButtons && (
            <div class="account-creation-buttons-row">
              <CWAccountCreationButton
                onclick={() => {
                  // fill in
                }}
              />
              <CWAccountCreationButton
                creationType="linkAccount"
                onclick={() => {
                  // fill in
                }}
              />
            </div>
          )}
          {hasWalletList && (
            <CWWalletsList
              connectAnotherWayOnclick={() => {
                // this.sidebarType = 'ethWallet';
                // this.bodyType = 'connectWithEmail';
              }}
              darkMode
              wallets={wallets}
            />
          )}
          {bodyType === 'welcome' && (
            <div class="inner-body-container">
              <CWAvatarUsernameInput
                address={address}
                darkMode
                defaultValue={username}
                onAvatarChangeHandler={(a) => {
                  handleSetAvatar(a);
                }}
                onUsernameChangeHandler={(u) => {
                  handleSetUsername(u);
                }}
                orientation="vertical"
              />
              <CWButton label="Finish" />
            </div>
          )}
          {bodyType === 'selectProfile' && (
            <div class="inner-body-container">
              <div class="inner-inner-body-container">
                <CWText
                  type="h5"
                  fontWeight="medium"
                  className="inner-body-text"
                >
                  Linking
                </CWText>
                <CWAddress address={address} darkMode />
                <CWText
                  type="h5"
                  fontWeight="medium"
                  className="inner-body-text"
                >
                  to your Profile
                </CWText>
                <CWProfilesList profiles={profiles} darkMode />
              </div>
              <CWButton label="Finish" />
            </div>
          )}
          {bodyType === 'connectWithEmail' && (
            <div class="inner-body-container">
              <CWTextInput
                containerClassName="connect-with-email-input"
                label="email address"
                placeholder="your-email@email.com"
              />
              <div class="buttons-row">
                <CWButton label="Back" buttonType="secondary-blue-dark" />
                <CWButton
                  label="Connect"
                  disabled // not sure of conditional
                  buttonType="primary-blue-dark"
                />
              </div>
            </div>
          )}
          {bodyType === 'allSet' && (
            <div class="inner-body-container">
              <div class="inner-inner-body-container">
                <CWText
                  type="h5"
                  fontWeight="medium"
                  className="inner-body-text"
                >
                  You have sucessfully linked
                </CWText>
                <CWAddress address={address} darkMode />
                <CWText
                  type="h5"
                  fontWeight="medium"
                  className="inner-body-text"
                >
                  to your Profile
                </CWText>
                <CWProfileRow darkMode {...profiles[0]} />
              </div>
              <CWButton label="Finish" />
            </div>
          )}
        </div>
        {hasBoilerplate && !isWindowExtraSmall(window.innerWidth) && (
          <LoginBoilerplate darkMode />
        )}
      </div>
    );
  }
}
