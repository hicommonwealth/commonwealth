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
import { getText } from './helpers';
import { LoginBoilerplate } from './login_boilerplate';
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

    const hasEthAlert = bodyType === 'ethWalletList';

    const hasBoilerplate =
      bodyType === 'walletList' ||
      bodyType === 'connectWithEmail' ||
      bodyType === 'ethWalletList';

    const hasCreationButtons =
      bodyType === 'selectAccountType' ||
      bodyType === 'selectPrevious' ||
      bodyType === 'welcome';

    const hasWalletList =
      bodyType === 'walletList' || bodyType === 'ethWalletList';

    const { headerText, bodyText } = getText(bodyType);

    return (
      <div class="LoginMobile">
        <ModalExitButton iconButtonTheme="hasBackground" />
        {hasEthAlert && <div style="color: white;">eth alert</div>}
        <div class={bodyType}>
          <LoginText
            headerText={headerText}
            bodyText={bodyText}
            isMobile
            className="bottom-margin"
          />
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
              isMobile
              wallets={wallets}
            />
          )}
          {bodyType === 'welcome' && (
            <>
              <CWAvatarUsernameInput
                address={address}
                defaultValue={username}
                onAvatarChangeHandler={(a) => {
                  handleSetAvatar(a);
                }}
                onUsernameChangeHandler={(u) => {
                  handleSetUsername(u);
                }}
              />
              <CWButton label="Finish" />
            </>
          )}
          {bodyType === 'selectProfile' && (
            <>
              <CWText type="h5" fontWeight="medium">
                You have sucessfully linked
              </CWText>
              <CWAddress address={address} />
              <CWText type="h5" fontWeight="medium">
                to your Profile
              </CWText>
              <CWProfilesList profiles={profiles} />
              <CWButton label="Finish" />
            </>
          )}
          {bodyType === 'connectWithEmail' && (
            <>
              <CWTextInput
                label="email address"
                placeholder="your-email@email.com"
              />
              <div class="buttons-row">
                <CWButton label="Back" buttonType="secondary-blue" />
                <CWButton label="Connect" />
              </div>
            </>
          )}
          {bodyType === 'allSet' && (
            <>
              <CWText type="h5" fontWeight="medium">
                Linking
              </CWText>
              <CWAddress address={address} />
              <CWText type="h5" fontWeight="medium">
                to your Profile
              </CWText>
              <CWProfileRow {...profiles[0]} />
              <CWButton label="Finish" />
            </>
          )}
        </div>
        {hasBoilerplate && <LoginBoilerplate />}
      </div>
    );
  }
}
