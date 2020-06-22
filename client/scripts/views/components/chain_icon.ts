import 'components/chain_icon.scss';

import m from 'mithril';
import { ChainInfo, CommunityInfo } from 'models';

export const ChainIcon: m.Component<{ chain: ChainInfo, onclick?: Function }> = {
  view: (vnode) => {
    const { onclick } = vnode.attrs;
    return m('.ChainIcon', { class: onclick ? 'onclick' : '' }, [
      m('img.chain-icon', { src: vnode.attrs.chain.iconUrl, onclick }),
    ]);
  }
};

export const CommunityIcon: m.Component<{ community: CommunityInfo, onclick?: Function }> = {
  view: (vnode) => {
    const { community, onclick } = vnode.attrs;
    return m('.CommunityIcon', { class: onclick ? 'onclick' : '' }, [
      m('.community-icon', { onclick }, community.name.slice(0, 2).toLowerCase()),
    ]);
  }
};
