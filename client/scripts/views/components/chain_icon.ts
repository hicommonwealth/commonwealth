import 'components/chain_icon.scss';

import { default as m } from 'mithril';
import { ChainInfo, CommunityInfo } from 'models';

export const ChainIcon: m.Component<{ chain: ChainInfo }> = {
  view: (vnode) => {
    return m('.ChainIcon', [
      m('img.chain-icon', { src: vnode.attrs.chain.iconUrl }),
    ]);
  }
};

export const CommunityIcon: m.Component<{ community: CommunityInfo }> = {
  view: (vnode) => {
    const { community } = vnode.attrs;
    return m('.CommunityIcon', [
      m('.community-icon', community.name.slice(0, 2).toLowerCase()),
    ]);
  }
};
