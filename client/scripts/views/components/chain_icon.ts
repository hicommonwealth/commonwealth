import 'components/chain_icon.scss';

import { default as m } from 'mithril';
import { ChainInfo } from 'models';

const ChainIcon: m.Component<{ chain: ChainInfo }> = {
  view: (vnode) => {
    return m('.ChainIcon', [
      m('img.chain-icon', { src: vnode.attrs.chain.iconUrl }),
    ]);
  }
};

export default ChainIcon;
