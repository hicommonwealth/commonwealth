/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import type { ChainInfo } from 'models';

import 'pages/user_dashboard/user_dashboard_chain_event_row.scss';
import type { IEventLabel } from '../../../../../../chain-events/src';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { IconName } from '../../components/component_kit/cw_icons/cw_icon_lookup';
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
        <div className="chain-event-icon-container">
          {label.icon && <CWIcon
            iconName={label.icon as IconName}
            className={label.icon === 'delegate' ? 'delegate' : ''}
          />}
        </div>
        <div class="chain-event-text-container">
          <div className="community-title">
            <CWCommunityAvatar community={chain} size="small" />
              <a
                onclick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  m.route.set(`/${chain}`);
                }}
              >
              <CWText type="caption" fontWeight="medium">
                {chain?.name || 'Unknown chain'}
              </CWText>
            </a>
            <div className="dot">.</div>
            <CWText type="caption" fontWeight="medium" className="block">
              Block {blockNumber}
            </CWText>
          </div>
          <CWText className="row-top-text" fontWeight="bold">
            {label.heading}
          </CWText>
          <CWText type="caption" className="label">{label.label}</CWText>
        </div>
      </div>
    );
  }
}
