/* @jsx m */

import m from 'mithril';
import { Tag } from 'construct-ui';

import 'pages/user_dashboard/dashboard_communities_preview.scss';

import app from 'state';
import { ChainInfo } from 'client/scripts/models';
import { pluralize } from 'helpers';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';

const getNewTag = (labelCount?: number) => {
  const label = labelCount ? 'New' : `${labelCount} new`;

  return <Tag label={label} size="xs" rounded intent="primary" />;
};

class CommunityPreviewCard implements m.ClassComponent<{ chain: ChainInfo }> {
  view(vnode) {
    const { chain } = vnode.attrs;
    const { unseenPosts } = app.user;
    const visitedChain = !!unseenPosts[chain.id];
    const updatedThreads = unseenPosts[chain.id]?.activePosts || 0;
    const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(
      chain.id
    );
    const isMember = app.user.isMember({
      account: app.user.activeAccount,
      chain: chain.id,
    });

    return (
      <CWCard
        className="CommunityPreviewCard"
        elevation="elevation-1"
        interactive
        onclick={(e) => {
          e.preventDefault();
          m.route.set(`/${chain.id}`);
        }}
      >
        <div class="card-top">
          <CWCommunityAvatar community={chain} />
          <CWText type="h4" fontWeight="medium">
            {chain.name}
          </CWText>
        </div>
        <CWText className="card-subtext">{chain.description}</CWText>
        {/* if no recently active threads, hide this module altogether */}
        {!!monthlyThreadCount && (
          <>
            <CWText className="card-subtext" type="b2" fontWeight="medium">
              {monthlyThreadCount > 20
                ? `${pluralize(
                    Math.floor(monthlyThreadCount / 5),
                    'thread'
                  )} this week`
                : `${pluralize(monthlyThreadCount, 'thread')} this month`}
            </CWText>
            {isMember && (
              <>
                {app.isLoggedIn() && !visitedChain && getNewTag()}
                {updatedThreads > 0 && getNewTag(updatedThreads)}
              </>
            )}
          </>
        )}
      </CWCard>
    );
  }
}

export class DashboardCommunitiesPreview implements m.ClassComponent {
  view() {
    const sortedChains = app.config.chains
      .getAll()
      .sort((a, b) => {
        const threadCountA = app.recentActivity.getCommunityThreadCount(a.id);
        const threadCountB = app.recentActivity.getCommunityThreadCount(b.id);
        return threadCountB - threadCountA;
      })
      .map((chain) => {
        return <CommunityPreviewCard chain={chain} />;
      });

    return (
      <div class="DashboardCommunitiesPreview">
        <CWText type="h3">Active Communities</CWText>
        <div class="community-preview-cards-collection">
          {sortedChains.length > 3 ? sortedChains.slice(0, 3) : sortedChains}
        </div>
        <CWButton
          onclick={() => {
            m.route.set('/communities');
            m.redraw();
          }}
          label="View more communities"
        />
      </div>
    );
  }
}
