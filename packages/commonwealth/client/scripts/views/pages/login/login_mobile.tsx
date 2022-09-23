/* @jsx m */

import { Spinner } from 'construct-ui';
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
      setBodyType,
      handleSetAvatar,
      handleSetUsername,
      profiles,
      setProfiles,
      handleSetEmail,
      setSidebarType,
      username,
      wallets,
      setSelectedWallet,
      createNewAccountCallback,
      linkExistingAccountCallback,
      accountVerifiedCallback,
      handleEmailLoginCallback,
      saveProfileInfoCallback,
      performLinkingCallback,
      setSelectedLinkingWallet,
      magicLoading,
      showResetWalletConnect,
    } = vnode.attrs;

    const hasBoilerplate =
      bodyType === 'walletList' ||
      bodyType === 'connectWithEmail' ||
      bodyType === 'ethWalletList';

    const hasCreationButtons =
      bodyType === 'selectAccountType' ||
      bodyType === 'selectPrevious' ||
      bodyType === 'welcome';

    const { headerText, bodyText } = getText(bodyType);

    return (
      <div class="LoginMobile">
        <ModalExitButton iconButtonTheme="hasBackground" />
        {bodyType === 'ethWalletList' && <LoginEthAlert />}
        <div class={bodyType}>
          <LoginText headerText={headerText} bodyText={bodyText} isMobile />
          {hasCreationButtons && (
            <div class="account-creation-buttons-row">
              <CWAccountCreationButton onclick={createNewAccountCallback} />
              <CWAccountCreationButton
                creationType="linkAccount"
                onclick={linkExistingAccountCallback}
              />
            </div>
          )}
          {bodyType === 'walletList' && (
            <CWWalletsList
              connectAnotherWayOnclick={() => {
                setBodyType('connectWithEmail');
              }}
              wallets={wallets}
              darkMode={true}
              setSelectedWallet={setSelectedWallet}
              setProfiles={setProfiles}
              setSidebarType={setSidebarType}
              setBodyType={setBodyType}
              accountVerifiedCallback={accountVerifiedCallback}
              showResetWalletConnect={showResetWalletConnect}
              linking={false}
            />
          )}
          {bodyType === 'selectPrevious' && (
            <CWWalletsList
              connectAnotherWayOnclick={() => {
                setBodyType('connectWithEmail');
              }}
              wallets={wallets}
              darkMode={true}
              setProfiles={setProfiles}
              setSidebarType={setSidebarType}
              setSelectedWallet={setSelectedLinkingWallet}
              setBodyType={setBodyType}
              accountVerifiedCallback={accountVerifiedCallback}
              showResetWalletConnect={showResetWalletConnect}
              linking={true}
            />
          )}
          {bodyType === 'welcome' && (
            <div class="inner-body-container">
              <CWAvatarUsernameInput
                address={address}
                darkMode
                value={username}
                onAvatarChangeHandler={(a) => {
                  handleSetAvatar(a);
                }}
                onUsernameChangeHandler={(u) => {
                  handleSetUsername(u);
                }}
                orientation="vertical"
              />
              <CWButton label="Finish" onclick={saveProfileInfoCallback} />
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
              <CWButton label="Finish" onclick={performLinkingCallback} />
            </div>
          )}
          {bodyType === 'connectWithEmail' && (
            <div class="inner-body-container">
              {!magicLoading ? (
                <CWTextInput
                  label="email address"
                  placeholder="your-email@email.com"
                  oninput={handleSetEmail}
                  onenterkey={handleEmailLoginCallback}
                />
              ) : (
                <Spinner active={true} size="xl" position="inherit" />
              )}
              <div class="buttons-row">
                <CWButton
                  label="Back"
                  buttonType="secondary-blue-dark"
                  onclick={() => {
                    setBodyType('walletList');
                  }}
                />
                <CWButton
                  label="Connect"
                  onclick={handleEmailLoginCallback}
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
