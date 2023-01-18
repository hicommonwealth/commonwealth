/* @jsx m */

import ClassComponent from 'class_component';
import { pluralize } from 'helpers';
import m from 'mithril';
import type { ChainInfo } from 'models';

import 'pages/user_dashboard/dashboard_communities_preview.scss';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';

type CommunityPreviewCardAttrs = {
  chain: ChainInfo;
};

class CommunityPreviewCard extends ClassComponent<CommunityPreviewCardAttrs> {
  view(vnode: m.Vnode<CommunityPreviewCardAttrs>) {
    const { chain } = vnode.attrs;
    const { unseenPosts } = app.user;
    const visitedChain = !!unseenPosts[chain.id];
    const updatedThreads = unseenPosts[chain.id]?.activePosts || 0;
    const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(
      chain.id
    );
    const isMember = app.roles.isMember({
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
              {`${pluralize(monthlyThreadCount, 'new thread')} this month`}
            </CWText>
            {isMember && (
              <>
                {app.isLoggedIn() && !visitedChain && (
                  <CWText className="new-activity-tag">New</CWText>
                )}
                {updatedThreads > 0 && (
                  <CWText className="new-activity-tag">
                    {updatedThreads} new
                  </CWText>
                )}
              </>
            )}
          </>
        )}
      </CWCard>
    );
  }
}

export class DashboardCommunitiesPreview extends ClassComponent {
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
        {app.user?.isSiteAdmin && <CWButton // @TODO: this is a hack to hide the button for non admins
          onclick={() => {
            m.route.set('/projects/explore');
            m.redraw();
          }}
          label="View crowdfund projects"
        />}
      </div>
    );
  }
}
