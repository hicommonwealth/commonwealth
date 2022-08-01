/* @jsx m */

import m from 'mithril';

import 'pages/user_dashboard/user_dashboard_chain_event_row.scss';

import { IEventLabel } from '../../../../../../chain-events/src';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

type UserDashboardChainEventRowAttrs = {
  blockNumber: number;
  chain: string;
  communityName: string;
  label: IEventLabel;
};

export class UserDashboardChainEventRow
  implements m.ClassComponent<UserDashboardChainEventRowAttrs>
{
  view(vnode) {
    const { blockNumber, chain, communityName, label } = vnode.attrs;

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
              {communityName}
            </a>
            <span class="block-number">Block {blockNumber}</span>
          </CWText>
          <CWText>{label.label}</CWText>
        </div>
      </div>
    );
  }
}
