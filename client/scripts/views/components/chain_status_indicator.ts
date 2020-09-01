import 'components/chain_status_indicator.scss';

import m from 'mithril';
import { formatNumberLong } from 'helpers';
import app, { ApiStatus } from 'state';

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
      [ApiStatus.Connected, 'Online'],
    ]);


    const blockNum = app.chain?.block?.height ? formatNumberLong(app.chain?.block?.height) : '0';
    const title = !app.chain ? '' : app.chain.networkStatus === ApiStatus.Connected
      ? `${apiStatusToLabel.get(app.chain.networkStatus)} - Block ${blockNum}`
      : apiStatusToLabel.get(app.chain.networkStatus);

    return m('.ChainStatusIndicator', [
      m('.status', {
        class: app.chain ? apiStatusToClass.get(app.chain.networkStatus) : '',
        title,
      }, hideLabel ? '' : title)
    ]);
  }
};

export default ChainStatusIndicator;
