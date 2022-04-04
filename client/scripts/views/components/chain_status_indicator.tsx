/* @jsx m */

import m from 'mithril';

import 'components/chain_status_indicator.scss';

import app, { ApiStatus } from 'state';

type ChainStatusIndicatorAttrs = {
  hideLabel: boolean;
};

export class ChainStatusIndicator
  implements m.ClassComponent<ChainStatusIndicatorAttrs>
{
  view(vnode) {
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

    return (
      <div class="ChainStatusIndicator">
        <div
          class={`status ${
            app.chain ? apiStatusToClass.get(app.chain.networkStatus) : ''
          }`}
          title={title}
        >
          {hideLabel ? '' : title}
        </div>
      </div>
    );
  }
}
