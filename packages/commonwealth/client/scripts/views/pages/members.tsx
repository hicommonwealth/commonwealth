import React, { useEffect, useState } from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
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
import { useDebounceOnFunction } from 'mithrilInterop/helpers';

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
const MembersPage = () => {
  const [initialProfilesLoaded, setInitialProfilesLoaded] = useState(false);
  const [initialScrollFinished, setInitialScrollFinished] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState<MemberInfo[] | null>(null);
  const [membersRequested, setMembersRequested] = useState(false);
  const [numProfilesLoaded, setNumProfilesLoaded] = useState(0);
  const [profilesFinishedLoading, setProfilesFinishedLoading] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState<ProfileInfo[]>([]);
  const [totalMembersCount, setTotalMembersCount] = useState(0);

  // handleScroll = () => {
  //   const scrollHeight = $(document).height();

  //   const scrollPos = $(window).height() + $(window).scrollTop();

  //   if (scrollPos > scrollHeight - 400 && !profilesFinishedLoading) {
  //     const lastLoadedProfileIndex = numProfilesLoaded;

  //     const newBatchSize = Math.min(
  //       DEFAULT_MEMBER_REQ_SIZE,
  //       membersLoaded.length - lastLoadedProfileIndex
  //     );

  //     const newBatchEnd = lastLoadedProfileIndex + newBatchSize;

  //     for (let i = lastLoadedProfileIndex; i < newBatchEnd; i++) {
  //       const member = membersLoaded[i];
  //       const profileInfo: ProfileInfo = {
  //         profile: app.profiles.getProfile(member.chain, member.address),
  //         postCount: member.count,
  //       };
  //       profilesLoaded.push(profileInfo);
  //     }

  //     numProfilesLoaded += newBatchSize;
  //     redraw();
  //   }
  // };

  // debouncedHandleScroll = useDebounceOnFunction(this.handleScroll, 400, []);

  const activeEntity = app.chain;
  if (!activeEntity) return <PageLoading message="Loading members" />;
  const activeInfo = app.chain.meta;

  useEffect(() => {
    // get members once
    console.log('activeInfo: ', activeInfo);
    if (!membersRequested) {
      setMembersRequested(true);

      activeInfo.getMembers(activeInfo.id).then(() => {
        const activeMembersHash = {};

        setTotalMembersCount(activeInfo.members.length);
        console.log('total members count: ', activeInfo.members.length);
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

        setMembersLoaded(
          membersActive
            .concat(membersInactive)
            .sort((a, b) => b.count - a.count)
        );
        redraw();
        console.log('Members loaded: ', membersLoaded);
      });
    }
  }, [activeInfo]);

  if (!membersLoaded) return <PageLoading message="Loading members" />;

  const navigatedFromAccount =
    app.lastNavigatedBack() &&
    app.lastNavigatedFrom().includes(`/${app.activeChainId()}/account/`) &&
    localStorage[`${app.activeChainId()}-members-scrollY`];

  // Load default number of profiles on mount
  if (!initialProfilesLoaded) {
    setInitialScrollFinished(false);
    setInitialProfilesLoaded(true);

    // TODO: expand into controller
    app.profiles.isFetched.on('redraw', () => {
      redraw();
    });

    // Set initial number loaded (contingent on navigation)
    if (navigatedFromAccount) {
      setNumProfilesLoaded(
        Number(localStorage[`${app.activeChainId()}-members-numProfilesLoaded`])
      );
    } else {
      setNumProfilesLoaded(
        Math.min(DEFAULT_MEMBER_REQ_SIZE, membersLoaded.length)
      );
    }

    setProfilesFinishedLoading(numProfilesLoaded >= membersLoaded.length);

    const profileInfos: ProfileInfo[] = membersLoaded
      .slice(0, numProfilesLoaded)
      .map((member) => {
        return {
          profile: app.profiles.getProfile(member.chain, member.address),
          postCount: member.count,
        };
      });

    setProfilesLoaded(profileInfos);
  }

  // Check if all profiles have been loaded
  if (!profilesFinishedLoading) {
    if (profilesLoaded.length >= membersLoaded.length) {
      setProfilesFinishedLoading(true);
    }
  }

  // Return to correct scroll position upon redirect from accounts page
  if (navigatedFromAccount && initialScrollFinished) {
    setInitialScrollFinished(true);

    setTimeout(() => {
      window.scrollTo(
        0,
        Number(localStorage[`${app.activeChainId()}-members-scrollY`])
      );
    }, 100);
  }

  return (
    <Sublayout>
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
};

export default MembersPage;
