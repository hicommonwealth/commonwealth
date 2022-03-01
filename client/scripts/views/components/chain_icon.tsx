/* @jsx m */

import m from 'mithril';

import 'components/chain_icon.scss';

import { ChainInfo } from 'models';

type BaseChainIconAttrs = {
  onclick?: () => void;
  size?: number;
};

type ChainIconAttrs = BaseChainIconAttrs & { chain: ChainInfo };

export class ChainIcon implements m.ClassComponent<ChainIconAttrs> {
  view(vnode) {
    const { onclick, size = 32 } = vnode.attrs;
    const iconUrl =
      vnode.attrs.chain.iconUrl || (vnode.attrs.chain as any).icon_url;

    return (
      <div class={`ChainIcon ${onclick ? 'onclick' : ''}`}>
        {iconUrl ? (
          <img
            class="chain-icon"
            style={`width: ${size}px; height: ${size}px;`}
            src={iconUrl}
            onclick={onclick}
          />
        ) : (
          <div
            class="chain-icon.no-image"
            style={`width: ${size}px; height: ${size}px;`}
            onclick={onclick}
          >
            <span>{vnode.attrs.chain.name.slice(0, 1)}</span>
          </div>
        )}
      </div>
    );
  }
}

type WalletIconAttrs = BaseChainIconAttrs & { walletName: string };

export class WalletIcon implements m.ClassComponent<WalletIconAttrs> {
  view(vnode) {
    const { onclick, size = 32, walletName } = vnode.attrs;

    return walletName ? (
      <div class={`ChainIcon ${onclick ? 'onclick' : ''}`}>
        <img
          class="chain-icon"
          style={`width: ${size}px; height: ${size}px;`}
          src={`/static/img/wallets/${walletName}.png`}
          onclick={onclick}
        />
      </div>
    ) : null;
  }
}

type TokenIconAttrs = BaseChainIconAttrs & { token: any };

export class TokenIcon implements m.ClassComponent<TokenIconAttrs> {
  view(vnode) {
    const { onclick, size = 32, token } = vnode.attrs;

    return (
      <div class={`TokenIcon ${onclick ? 'onclick' : ''}`}>
        {token.logoURI ? (
          <img
            class="token-icon"
            style={`width: ${size}px; height: ${size}px;`}
            src={token.logoURI}
            onclick={onclick}
          />
        ) : (
          <div
            class="token-icon.no-image"
            style={`width: ${size}px; height: ${size}px;`}
            onclick={onclick}
          >
            <span>{token.name.slice(0, 1)}</span>
          </div>
        )}
      </div>
    );
  }
}
