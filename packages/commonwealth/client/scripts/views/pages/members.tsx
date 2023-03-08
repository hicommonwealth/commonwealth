/* @jsx m */

import ClassComponent from 'class_component';
import $ from 'jquery';
import _ from 'lodash';
import m from 'mithril';
import type { MinimumProfile } from 'models';

import 'pages/members.scss';

import app from 'state';
import User from 'views/components/widgets/user';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { CWText } from '../components/component_kit/cw_text';

// The number of member profiles that are batch loaded
const DEFAULT_MEMBER_REQ_SIZE = 20;

type MemberInfo = {
  address: string;
  chain: string;
  count: number;
};

type ProfileInfo = {
  postCount: number;
  profile: MinimumProfile;
};

class MembersPage extends ClassComponent {
  private initialProfilesLoaded: boolean;
  private initialScrollFinished: boolean;
  private membersLoaded: MemberInfo[];
  private membersRequested: boolean;
  private numProfilesLoaded: number;
  private onscroll: any;
  private profilesFinishedLoading: boolean;
  private profilesLoaded: ProfileInfo[];
  private totalMembersCount: number;

  view() {
    const activeEntity = app.chain;

    if (!activeEntity)
      return (
        <PageLoading
          message="Loading members"
          title={<BreadcrumbsTitleTag title="Members" />}
        />
      );

    // get members once
    const activeInfo = app.chain.meta;

    if (!this.membersRequested) {
      this.membersRequested = true;

      activeInfo.getMembers(activeInfo.id).then(() => {
        const activeMembersHash = {};

        this.totalMembersCount = activeInfo.members.length;

        const membersActive: MemberInfo[] = app.recentActivity
          .getMostActiveUsers()
          .map((user) => {
            const { chain, address } = user.info;
            activeMembersHash[`${chain}##${address}`] = true;
            return { chain, address, count: user.count };
          });

        const membersInactive: MemberInfo[] = activeInfo.members
          .map((role) => {
            return {
              address: role.address,
              chain: role.address_chain,
              count: 0,
            };
          })
          .filter((info) => {
            const { chain, address } = info;
            return !activeMembersHash[`${chain}##${address}`];
          });

        this.membersLoaded = membersActive
          .concat(membersInactive)
          .sort((a, b) => b.count - a.count);
        m.redraw();
      });
    }

    if (!this.membersLoaded)
      return (
        <PageLoading
          message="Loading members"
          title={<BreadcrumbsTitleTag title="Members" />}
        />
      );

    const navigatedFromAccount =
      app.lastNavigatedBack() &&
      app.lastNavigatedFrom().includes(`/${app.activeChainId()}/account/`) &&
      localStorage[`${app.activeChainId()}-members-scrollY`];

    // Load default number of profiles on mount
    if (!this.initialProfilesLoaded) {
      this.initialScrollFinished = false;
      this.initialProfilesLoaded = true;

      // Set initial number loaded (contingent on navigation)
      if (navigatedFromAccount) {
        this.numProfilesLoaded = Number(
          localStorage[`${app.activeChainId()}-members-numProfilesLoaded`]
        );
      } else {
        this.numProfilesLoaded = Math.min(
          DEFAULT_MEMBER_REQ_SIZE,
          this.membersLoaded.length
        );
      }

      this.profilesFinishedLoading =
        this.numProfilesLoaded >= this.membersLoaded.length;

      const profileInfos: ProfileInfo[] = this.membersLoaded
        .slice(0, this.numProfilesLoaded)
        .map((member) => {
          const profile = app.newProfiles.getProfile(
            member.chain,
            member.address
          );
          profile.initialize(
            profile.name,
            profile.address,
            profile.avatarUrl,
            profile.id,
            profile.chain,
            profile.lastActive
          );
          return {
            profile,
            postCount: member.count,
          };
        });

      this.profilesLoaded = profileInfos;
    }

    // Check if all profiles have been loaded
    if (!this.profilesFinishedLoading) {
      if (this.profilesLoaded.length >= this.membersLoaded.length) {
        this.profilesFinishedLoading = true;
      }
    }

    // Return to correct scroll position upon redirect from accounts page
    if (navigatedFromAccount && !this.initialScrollFinished) {
      this.initialScrollFinished = true;

      setTimeout(() => {
        window.scrollTo(
          0,
          Number(localStorage[`${app.activeChainId()}-members-scrollY`])
        );
      }, 100);
    }

    this.onscroll = _.debounce(() => {
      const scrollHeight = $(document).height();

      const scrollPos = $(window).height() + $(window).scrollTop();

      if (scrollPos > scrollHeight - 400 && !this.profilesFinishedLoading) {
        const lastLoadedProfileIndex = this.numProfilesLoaded;

        const newBatchSize = Math.min(
          DEFAULT_MEMBER_REQ_SIZE,
          this.membersLoaded.length - lastLoadedProfileIndex
        );

        const newBatchEnd = lastLoadedProfileIndex + newBatchSize;

        for (let i = lastLoadedProfileIndex; i < newBatchEnd; i++) {
          const member = this.membersLoaded[i];
          const profile = app.newProfiles.getProfile(
            member.chain,
            member.address
          );
          profile.initialize(
            profile.name,
            profile.address,
            profile.avatarUrl,
            profile.id,
            profile.chain,
            profile.lastActive
          );
          const profileInfo: ProfileInfo = {
            profile,
            postCount: member.count,
          };
          this.profilesLoaded.push(profileInfo);
        }

        this.numProfilesLoaded += newBatchSize;
        m.redraw();
      }
    }, 400);

    const {
      membersLoaded,
      numProfilesLoaded,
      profilesFinishedLoading,
      profilesLoaded,
      totalMembersCount,
    } = this;

    return (
      <Sublayout
        title={<BreadcrumbsTitleTag title="Members" />}
        onscroll={this.onscroll}
      >
        <div class="MembersPage">
          <CWText type="h3" fontWeight="medium">
            {totalMembersCount ? `Members (${totalMembersCount})` : 'Members'}
          </CWText>
          <div class="header-row">
            <CWText type="h5">Member</CWText>
            <CWText type="h5">Posts / Month</CWText>
          </div>
          <div class="members-container">
            {profilesLoaded.map((profileInfo) => {
              const { id } = profileInfo.profile;
              return (
                <div class="member-row">
                  <a
                    href={`/profile/id/${id}`}
                    onclick={(e) => {
                      e.preventDefault();
                      localStorage[`${app.activeChainId()}-members-scrollY`] =
                        window.scrollY;
                      localStorage[
                        `${app.activeChainId()}-members-numProfilesLoaded`
                      ] = numProfilesLoaded;
                      m.route.set(`/profile/id/${id}`);
                    }}
                  >
                    {m(User, { user: profileInfo.profile, showRole: true })}
                  </a>
                  <CWText>{profileInfo.postCount}</CWText>
                </div>
              );
            })}
          </div>
          <div class="infinite-scroll-wrapper">
            {profilesFinishedLoading ? (
              <CWText className="infinite-scroll-reached-end-text">
                Showing all {membersLoaded.length} community members
              </CWText>
            ) : (
              <CWSpinner size="large" />
            )}
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default MembersPage;
