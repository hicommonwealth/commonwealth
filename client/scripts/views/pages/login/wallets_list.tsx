/* @jsx m */

import m from 'mithril';

import 'pages/login/wallets_list.scss';

import { WalletId } from 'types';
import { CWText } from '../../components/component_kit/cw_text';
import { CWWalletOptionRow } from '../../components/component_kit/cw_wallet_option_row';
import { CWTooltip } from '../../components/component_kit/cw_tooltip';
import { getClasses } from '../../components/component_kit/helpers';

type WalletsListAttrs = {
  connectAnotherWayOnclick: () => void;
  hasNoWalletsLink?: boolean;
  isMobile?: boolean;
  wallets: Array<WalletId>;
};

export class WalletsList implements m.ClassComponent<WalletsListAttrs> {
  view(vnode) {
    const {
      connectAnotherWayOnclick,
      hasNoWalletsLink = true,
      isMobile,
      wallets,
    } = vnode.attrs;
    return (
      <div class="WalletsList">
        <div class="wallets-and-link-container">
          <div
            class={getClasses<{ isMobile?: boolean }>({ isMobile }, 'wallets')}
          >
            {wallets.map((w) => (
              <CWWalletOptionRow
                walletName={w}
                isMobile={isMobile}
                onclick={() => {
                  // link to where?
                }}
              />
            ))}
          </div>
          {hasNoWalletsLink && (
            <CWTooltip
              interactionType="hover"
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
              tooltipType="solidNoArrow"
              trigger={
                <CWText
                  type="caption"
                  className={getClasses<{ isMobile?: boolean }>(
                    { isMobile },
                    'no-wallet-link'
                  )}
                >
                  Don't see your wallet?
                </CWText>
              }
            />
          )}
        </div>
        <CWText type="b2" className="connect-another-way-link">
          <a onclick={connectAnotherWayOnclick}>Connect Another Way</a>
        </CWText>
      </div>
    );
  }
}
