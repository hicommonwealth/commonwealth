import 'components/chain_status_indicator.scss';

import m from 'mithril';
import app, { ApiStatus } from 'state';

const ChainStatusIndicator: m.Component<{
  hideLabel: boolean;
}> = {
  view: (vnode) => {
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

    const title = !app.chain
      ? ''
      : app.chain.networkStatus !== ApiStatus.Connected
      ? apiStatusToLabel.get(app.chain.networkStatus)
      : app.chain?.block?.height
      ? 'Connected'
      : 'Loading...';

    return m('.ChainStatusIndicator', [
      m(
        '.status',
        {
          class: app.chain ? apiStatusToClass.get(app.chain.networkStatus) : '',
          title,
        },
        hideLabel ? '' : title
      ),
    ]);
  },
};

export default ChainStatusIndicator;
