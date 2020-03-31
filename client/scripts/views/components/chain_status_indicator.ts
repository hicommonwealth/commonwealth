import 'components/chain_status_indicator.scss';

import { default as m } from 'mithril';
import app from 'state';

import { ApiStatus } from 'state';

interface IAttrs {
  hideLabel: boolean;
}

const ChainStatusIndicator: m.Component<IAttrs> = {
  view: (vnode: m.VnodeDOM<IAttrs>) => {
    const hideLabel = vnode.attrs.hideLabel;

    const apiStatusToClass = new Map<ApiStatus, string>([
      [ApiStatus.Disconnected, 'disconnected'],
      [ApiStatus.Connecting, 'connecting'],
      [ApiStatus.Connected, 'connected'],
    ]);
    const apiStatusToLabel = new Map<ApiStatus, string>([
      [ApiStatus.Disconnected, 'Disconnected'],
      [ApiStatus.Connecting, 'Connecting'],
      [ApiStatus.Connected, 'Connected'],
    ]);

    return m('.ChainStatusIndicator', [
      m('.status', {
        class: app.chain ? apiStatusToClass.get(app.chain.networkStatus) : '',
        title: app.chain ? apiStatusToLabel.get(app.chain.networkStatus) : '',
      }, (hideLabel || !app.chain) ? '' : apiStatusToLabel.get(app.chain.networkStatus)),
    ]);
  }
};

export default ChainStatusIndicator;
