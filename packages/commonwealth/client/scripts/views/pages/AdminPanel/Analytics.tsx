import { ALL_COMMUNITIES } from '@hicommonwealth/shared';
import useGetStatsQuery from 'client/scripts/state/api/superAdmin/getStats';
import React, { useState } from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import './AdminPanel.scss';
import CommunityFinder from './CommunityFinder';

const Analytics = () => {
  const { data: globalStats, isLoading: globalStatsLoading } =
    useGetStatsQuery(ALL_COMMUNITIES);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const { data: communityAnalytics, isLoading: communityAnalyticsLoading } =
    useGetStatsQuery(selectedCommunityId);

  function getCommunityAnalytics(community_id: string) {
    setSelectedCommunityId(community_id);
  }

  return (
    <div className="Analytics">
      {globalStatsLoading ? (
        <CWCircleMultiplySpinner />
      ) : (
        <>
          <div className="AnalyticsSection">
            <CWText type="h4">Site Statistics</CWText>

            <CWText type="caption">
              All stats pulled from the last 30 days of global site activity.
            </CWText>
            <div className="Stats">
              <div className="Stat">
                <CWText fontWeight="medium">Total Threads</CWText>
                <CWText className="StatValue">
                  {globalStats?.totalStats.numThreadsLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">Total Comments</CWText>
                <CWText className="StatValue">
                  {globalStats?.totalStats.numCommentsLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">Total Reactions</CWText>
                <CWText className="StatValue">
                  {globalStats?.totalStats.numReactionsLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">Total Polls</CWText>
                <CWText className="StatValue">
                  {globalStats?.totalStats.numPollsLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">Total Votes</CWText>
                <CWText className="StatValue">
                  {globalStats?.totalStats.numProposalVotesLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">Total New Addresses</CWText>
                <CWText className="StatValue">
                  {globalStats?.totalStats.numMembersLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">Total New Groups</CWText>
                <CWText className="StatValue">
                  {globalStats?.totalStats.numGroupsLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">
                  Average Addresses Per Community
                </CWText>
                <CWText className="StatValue">
                  {Math.round(
                    globalStats?.totalStats?.averageAddressesPerCommunity || 0,
                  )}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">
                  {'Total Communities with > 2 addresses'}
                </CWText>
                <CWText className="StatValue">
                  {Math.round(
                    globalStats?.totalStats?.populatedCommunities || 0,
                  )}
                </CWText>
              </div>
            </div>
          </div>
          <div className="AnalyticsSection">
            <CWText type="h4">Community Lookup</CWText>
            <CWText type="caption">
              Search for 30 day analytics from a specific community.
            </CWText>
            <CommunityFinder
              ctaLabel="Search"
              onAction={getCommunityAnalytics}
            />
            {communityAnalytics && !communityAnalyticsLoading && (
              <div className="Stats">
                <div className="Stat">
                  <CWText fontWeight="medium">Total Threads</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.totalStats.numThreadsLastMonth}
                  </CWText>
                </div>
                <div className="Stat">
                  <CWText fontWeight="medium">Total Comments</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.totalStats.numCommentsLastMonth}
                  </CWText>
                </div>
                <div className="Stat">
                  <CWText fontWeight="medium">Total Reactions</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.totalStats.numReactionsLastMonth}
                  </CWText>
                </div>
                <div className="Stat">
                  <CWText fontWeight="medium">Total Polls</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.totalStats.numPollsLastMonth}
                  </CWText>
                </div>
                <div className="Stat">
                  <CWText fontWeight="medium">Total Votes</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.totalStats.numProposalVotesLastMonth}
                  </CWText>
                </div>
                <div className="Stat">
                  <CWText fontWeight="medium">Total New Addresses</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.totalStats.numMembersLastMonth}
                  </CWText>
                </div>
                <div className="Stat">
                  <CWText fontWeight="medium">Total New Groups</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.totalStats.numGroupsLastMonth}
                  </CWText>
                </div>
              </div>
            )}
          </div>
          <div className="AnalyticsSection">
            <CWText type="h4">New Communities (Last Month)</CWText>
            <CWText type="caption">
              The ids of all communities created in the last month
            </CWText>
            <div className="AnalyticsList">
              <CWText className="CommunityName no-hover">
                <CWText className="CommunityName no-hover">Name</CWText>
                <CWText className="RightSide no-hover">Created At</CWText>
              </CWText>
              {globalStats?.lastMonthNewCommunities &&
                globalStats?.lastMonthNewCommunities?.map((community) => {
                  return (
                    <CWText
                      onClick={() => {
                        window.open(`/${community.id}`, '_blank');
                      }}
                      className="CommunityName"
                      key={community.id}
                    >
                      <CWText className="CommunityName">{community.id}</CWText>
                      <CWText className="RightSide">
                        {new Date(community.created_at).toLocaleString()}
                      </CWText>
                    </CWText>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
