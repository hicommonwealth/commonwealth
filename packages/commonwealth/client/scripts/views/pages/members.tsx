/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';
import _ from 'lodash';
import $ from 'jquery';
import type { Profile } from 'models';

import 'pages/members.scss';

import app from 'state';
import { navigateToSubpage } from 'router';
import { PageLoading } from 'views/pages/loading';
import { User } from 'views/components/user/user';
import Sublayout from 'views/sublayout';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { CWText } from '../components/component_kit/cw_text';
import { useDebounceOnFunction } from 'client/scripts/mithrilInterop/helpers';

// The number of member profiles that are batch loaded
const DEFAULT_MEMBER_REQ_SIZE = 20;

type MemberInfo = {
  address: string;
  chain: string;
  count: number;
};

type ProfileInfo = {
  postCount: number;
  profile: Profile;
};

class MembersPage extends ClassComponent {
  private initialProfilesLoaded: boolean;
  private initialScrollFinished: boolean;
  private membersLoaded: MemberInfo[];
  private membersRequested: boolean;
  private numProfilesLoaded: number;
  private profilesFinishedLoading: boolean;
  private profilesLoaded: ProfileInfo[];
  private totalMembersCount: number;

  view() {
    const activeEntity = app.chain;

    if (!activeEntity) return <PageLoading message="Loading members" />;

    function handleScroll() {
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
          const profileInfo: ProfileInfo = {
            profile: app.profiles.getProfile(member.chain, member.address),
            postCount: member.count,
          };
          this.profilesLoaded.push(profileInfo);
        }

        this.numProfilesLoaded += newBatchSize;
        this.redraw();
      }
    }

    const debouncedHandleScroll = useDebounceOnFunction(handleScroll, 400, []);

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
        this.redraw();
      });
    }

    if (!this.membersLoaded) return <PageLoading message="Loading members" />;

    const navigatedFromAccount =
      app.lastNavigatedBack() &&
      app.lastNavigatedFrom().includes(`/${app.activeChainId()}/account/`) &&
      localStorage[`${app.activeChainId()}-members-scrollY`];

    // Load default number of profiles on mount
    if (!this.initialProfilesLoaded) {
      this.initialScrollFinished = false;
      this.initialProfilesLoaded = true;

      // TODO: expand into controller
      app.profiles.isFetched.on('redraw', () => {
        this.redraw();
      });

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
          return {
            profile: app.profiles.getProfile(member.chain, member.address),
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

    const {
      membersLoaded,
      numProfilesLoaded,
      profilesFinishedLoading,
      profilesLoaded,
      totalMembersCount,
    } = this;

    return (
      <Sublayout onScroll={debouncedHandleScroll}>
        <div className="MembersPage">
          <CWText type="h3" fontWeight="medium">
            {totalMembersCount ? `Members (${totalMembersCount})` : 'Members'}
          </CWText>
          <div className="header-row">
            <CWText type="h5">Member</CWText>
            <CWText type="h5">Posts / Month</CWText>
          </div>
          <div className="members-container">
            {profilesLoaded.map((profileInfo, i) => {
              const { address, chain } = profileInfo.profile;
              return (
                <div className="member-row" key={i}>
                  <a
                    href={`/${app.activeChainId()}/account/${address}?base=${chain}`}
                    onClick={(e) => {
                      e.preventDefault();
                      localStorage[`${app.activeChainId()}-members-scrollY`] =
                        window.scrollY;
                      localStorage[
                        `${app.activeChainId()}-members-numProfilesLoaded`
                      ] = numProfilesLoaded;
                      navigateToSubpage(`/account/${address}?base=${chain}`);
                    }}
                  >
                    <User user={profileInfo.profile} showRole />
                  </a>
                  <CWText>{profileInfo.postCount}</CWText>
                </div>
              );
            })}
          </div>
          <div className="infinite-scroll-wrapper">
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
