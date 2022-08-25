/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_wallets_list.scss';

import { WalletId } from 'common-common/src/types';
import { CWText } from './cw_text';
import { CWWalletOptionRow } from './cw_wallet_option_row';
import { CWTooltip } from './cw_popover/cw_tooltip';
import { getClasses } from './helpers';

type WalletsListAttrs = {
  connectAnotherWayOnclick: () => void;
  darkMode?: boolean;
  hasNoWalletsLink?: boolean;
  wallets: Array<WalletId>;
};

export class CWWalletsList implements m.ClassComponent<WalletsListAttrs> {
  view(vnode) {
    const {
      connectAnotherWayOnclick,
      darkMode,
      hasNoWalletsLink = true,
      wallets,
    } = vnode.attrs;
    return (
      <div class="WalletsList">
        <div class="wallets-and-link-container">
          <div
            class={getClasses<{ darkMode?: boolean }>({ darkMode }, 'wallets')}
          >
            {wallets.map((w) => (
              <CWWalletOptionRow
                walletName={w}
                darkMode={darkMode}
                onclick={() => {
                  // link to where?
                }}
              />
            ))}
          </div>
          {hasNoWalletsLink && (
            <CWTooltip
              interactionType="click"
              tooltipContents={
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
