/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import type { ChainInfo } from 'models';

import 'pages/user_dashboard/user_dashboard_chain_event_row.scss';
import type { IEventLabel } from '../../../../../../chain-events/src';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

type UserDashboardChainEventRowAttrs = {
  blockNumber: number;
  chain: ChainInfo;
  label: IEventLabel;
};

export class UserDashboardChainEventRow extends ClassComponent<UserDashboardChainEventRowAttrs> {
  view(vnode: m.Vnode<UserDashboardChainEventRowAttrs>) {
    const { blockNumber, chain, label } = vnode.attrs;

    return (
      <div
        class={getClasses<{ isLink?: boolean }>(
          { isLink: !!label.linkUrl },
          'UserDashboardChainEventRow'
        )}
        onclick={() => {
          if (label.linkUrl) {
            m.route.set(label.linkUrl);
          }
          m.redraw();
        }}
      >
        <CWCommunityAvatar community={chain} />
        <div class="chain-event-text-container">
          <CWText className="row-top-text">
            <b>{label.heading}</b>
            <span>in</span>
            <a
              onclick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                m.route.set(`/${chain}`);
              }}
            >
              {chain?.name || 'Unknown chain'}
            </a>
            <span class="block-number">Block {blockNumber}</span>
          </CWText>
          <CWText>{label.label}</CWText>
        </div>
      </div>
    );
  }
}
