import 'components/chain_icon.scss';

import m from 'mithril';
import { ChainInfo, CommunityInfo } from 'models';

export const ChainIcon: m.Component<{ chain: ChainInfo, onclick?: Function, size?: number }> = {
  view: (vnode) => {
    const { onclick } = vnode.attrs;
    const size = vnode.attrs.size || 32;

    return m('.ChainIcon', { class: onclick ? 'onclick' : '' }, [
      m('img.chain-icon', {
        style: `width: ${size}px; height: ${size}px;`,
        src: vnode.attrs.chain.iconUrl,
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
      m('.community-icon', {
        style: `width: ${size}px; height: ${size}px;`,
        onclick
      }, [
        m('span', community.name.slice(0, 1))
      ]),
    ]);
  }
};
