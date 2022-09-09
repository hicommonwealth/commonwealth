/* @jsx m */

import m from 'mithril';
import app from 'state';
import 'components/component_kit/cw_wallets_list.scss';

import $ from 'jquery';

import { Account, IWebWallet } from 'models';
import { notifyInfo } from 'controllers/app/notifications';
import { createUserWithAddress } from 'controllers/app/login';
import Near from 'controllers/chain/near/main';

import { CWText } from './cw_text';
import { CWWalletOptionRow } from './cw_wallet_option_row';
import { CWTooltip } from './cw_popover/cw_tooltip';
import { getClasses } from './helpers';
import { ProfileRowAttrs } from './cw_profiles_list';

type WalletsListAttrs = {
  connectAnotherWayOnclick: () => void;
  darkMode?: boolean;
  hasNoWalletsLink?: boolean;
  wallets: Array<IWebWallet<any>>;
  setProfiles: (profiles: Array<ProfileRowAttrs>) => void;
  setSidebarType: (sidebarType: string) => void;
  setBodyType: (bodyType: string) => void;
  accountVerifiedCallback: (account: Account) => void;
  linking: boolean;
};

export class CWWalletsList implements m.ClassComponent<WalletsListAttrs> {
  view(vnode) {
    const {
      connectAnotherWayOnclick,
      darkMode,
      hasNoWalletsLink = true,
      wallets,
      setBodyType,
      setSidebarType,
      accountVerifiedCallback,
      linking,
    } = vnode.attrs;
    return (
      <div class="WalletsList">
        <div class="wallets-and-link-container">
          <div
            class={getClasses<{ darkMode?: boolean }>({ darkMode }, 'wallets')}
          >
            {wallets.map((wallet: IWebWallet<any>) => (
              <CWWalletOptionRow
                wallet={wallet}
                darkMode={darkMode}
                onclick={async () => {
                  await wallet.enable();

                  if (wallet.chain === 'near') {
                    // do something
                  } else if (wallet.chain === 'substrate') {
                    // do something
                  } else {
                    let address;
                    if (
                      wallet.chain === 'ethereum' ||
                      wallet.chain === 'solana'
                    ) {
                      address = wallet.accounts[0];
                    } else if (wallet.chain === 'cosmos') {
                      address = wallet.accounts[0].address;
                    }

                    if (app.isLoggedIn()) {
                      const { result } = await $.post(
                        `${app.serverUrl()}/getAddressStatus`,
                        {
                          address,
                          chain: wallet.chain,
                          jwt: app.user.jwt,
                        }
                      );
                      if (result.exists) {
                        if (result.belongsToUser) {
                          notifyInfo(
                            'This address is already linked to your current account.'
                          );
                          return;
                        } else {
                          // const modalMsg =
                          //   'This address is currently linked to another account. ' +
                          //   'Remove it from that account and transfer to yours?';
                          // const confirmed = await confirmationModalWithText(
                          //   modalMsg
                          // )();
                          // if (!confirmed) {
                          //   vnode.state.linking = false;
                          //   return;
                          // }
                        }
                      }
                    }

                    try {
                      const { account: signerAccount, newlyCreated } =
                        await createUserWithAddress(
                          address,
                          wallet.name,
                          app.chain?.id || wallet.defaultNetwork
                        );

                      await wallet.validateWithAccount(signerAccount);

                      // return if user signs for two addresses
                      // if (linkNewAddressModalVnode.state.linkingComplete)
                      //   return;
                      // linkNewAddressModalVnode.state.linkingComplete = true;
                      accountVerifiedCallback(
                        signerAccount,
                        newlyCreated,
                        linking
                      );

                      // setBodyType('selectAccountType');
                      // setSidebarType('newOrReturning');
                    } catch (err) {
                      // catch when the user rejects the sign message prompt
                      // vnode.state.linking = false;
                      // errorCallback('Verification failed');
                      //  m.redraw();
                      console.log(err);
                    }
                  }
                }}
              />
            ))}
          </div>
          {hasNoWalletsLink && (
            <CWTooltip
              interactionType="click"
              tooltipContent={
                <>
                  <CWText type="caption">
                    If you don’t see your wallet then make sure:
                  </CWText>
                  <CWText type="caption">
                    • Your wallet chrome extension installed?
                  </CWText>
                  <CWText type="caption">
                    • Your wallet chrome extension active?
                  </CWText>
                </>
              }
              tooltipType="solidArrow"
              trigger={
                <CWText
                  type="caption"
                  className={getClasses<{ darkMode?: boolean }>(
                    { darkMode },
                    'no-wallet-link'
                  )}
                >
                  Don't see your wallet?
                </CWText>
              }
            />
          )}
        </div>
        <CWText
          type="b2"
          className={getClasses<{ darkMode?: boolean }>(
            { darkMode },
            'connect-another-way-link'
          )}
        >
          <a onclick={connectAnotherWayOnclick}>Connect Another Way</a>
        </CWText>
      </div>
    );
  }
}
