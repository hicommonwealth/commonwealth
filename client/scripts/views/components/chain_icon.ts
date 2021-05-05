import 'components/chain_icon.scss';

import m from 'mithril';
import { ChainBase, ChainInfo, CommunityInfo } from 'models';

export const ChainIcon: m.Component<{ chain: ChainInfo, onclick?: Function, size?: number }> = {
  view: (vnode) => {
    const { onclick } = vnode.attrs;
    const size = vnode.attrs.size || 32;

    return m('.ChainIcon', { class: onclick ? 'onclick' : '' }, [
      m('img.chain-icon', {
        style: `width: ${size}px; height: ${size}px;`,
        src: vnode.attrs.chain.iconUrl || (vnode.attrs.chain as any).icon_url,
        onclick
      }),
    ]);
  }
};

export const ChainBaseIcon: m.Component<{ chainbase: ChainBase, onclick?: Function, size?: number }> = {
  view: (vnode) => {
    const { onclick } = vnode.attrs;
    const size = vnode.attrs.size || 32;
    const iconName = vnode.attrs.chainbase === ChainBase.Ethereum ? 'eth' : vnode.attrs.chainbase;

    return m('.ChainIcon', { class: onclick ? 'onclick' : '' }, [
      m('img.chain-icon', {
        style: `width: ${size}px; height: ${size}px;`,
        src: `/static/img/protocols/${iconName}.png`,
        onclick
      }),
    ]);
  }
};

export const CommunityIcon: m.Component<{ community: CommunityInfo, onclick?: Function, size?: number }> = {
  view: (vnode) => {
    const { community, onclick } = vnode.attrs;
    const size = vnode.attrs.size || 32;

    return m('.CommunityIcon', { class: onclick ? 'onclick' : '' }, [
      community.iconUrl
        ? m('img.community-icon', {
          style: `width: ${size}px; height: ${size}px;`,
          src: community.iconUrl,
          onclick
        })
        : m('.community-icon.no-image', {
          style: `width: ${size}px; height: ${size}px;`,
          onclick
        }, [
          m('span', community.name.slice(0, 1))
        ]),
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
