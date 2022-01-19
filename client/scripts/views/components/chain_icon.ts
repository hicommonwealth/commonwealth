/* eslint-disable @typescript-eslint/ban-types */
import 'components/chain_icon.scss';

import m from 'mithril';
import { ChainBase } from 'types';
import { ChainInfo } from 'models';

export const ChainIcon: m.Component<{ chain: ChainInfo, onclick?: Function, size?: number }> = {
  view: (vnode) => {
    const { onclick } = vnode.attrs;
    const size = vnode.attrs.size || 32;
    const iconUrl = vnode.attrs.chain.iconUrl || (vnode.attrs.chain as any).icon_url;

    return m('.ChainIcon', { class: onclick ? 'onclick' : '' }, [
      iconUrl ? m('img.chain-icon', {
        style: `width: ${size}px; height: ${size}px;`,
        src: iconUrl,
        onclick
      }) : m('.chain-icon.no-image', {
        style: `width: ${size}px; height: ${size}px;`,
        onclick
      }, [
        m('span', vnode.attrs.chain.name.slice(0, 1))
      ]),
    ]);
  }
};

export const WalletIcon: m.Component<{ walletName: string, onclick?: Function, size?: number }> = {
  view: (vnode) => {
    const { onclick, walletName } = vnode.attrs;
    const size = vnode.attrs.size || 32;
    if (!walletName) return;

    return m('.ChainIcon', { class: onclick ? 'onclick' : '' }, [
      m('img.chain-icon', {
        style: `width: ${size}px; height: ${size}px;`,
        src: `/static/img/wallets/${walletName}.png`,
        onclick
      }),
    ]);
  }
};

export const TokenIcon: m.Component<{ token: any, onclick?: Function, size?: number }> = {
  view: (vnode) => {
    const { token, onclick } = vnode.attrs;
    const size = vnode.attrs.size || 32;

    return m('.TokenIcon', { class: onclick ? 'onclick' : '' }, [
      token.logoURI
        ? m('img.token-icon', {
          style: `width: ${size}px; height: ${size}px;`,
          src: token.logoURI,
          onclick
        })
        : m('.token-icon.no-image', {
          style: `width: ${size}px; height: ${size}px;`,
          onclick
        }, [
          m('span', token.name.slice(0, 1))
        ]),
    ]);
  }
};
