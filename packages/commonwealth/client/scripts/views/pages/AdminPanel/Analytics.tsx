import axios from 'axios';
import { notifyError } from 'controllers/app/notifications';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import React, { useState } from 'react';
import { SERVER_URL } from 'state/api/config';
import useUserStore from 'state/ui/user';
import { CWText } from '../../components/component_kit/cw_text';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import './AdminPanel.scss';
import CommunityFinder from './CommunityFinder';

type Stats = {
  numCommentsLastMonth: number;
  numThreadsLastMonth: number;
  numPollsLastMonth: number;
  numReactionsLastMonth: number;
  numProposalVotesLastMonth: number;
  numMembersLastMonth: number;
  numGroupsLastMonth: number;
  averageAddressesPerCommunity: number;
  populatedCommunities: number;
};

const Analytics = () => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [lastMonthNewCommunties, setLastMonthNewCommunities] = useState<
    { id: string; created_at: string }[]
  >([]);
  const [globalStats, setGlobalStats] = useState<Stats>();
  const [communityLookupCompleted, setCommunityLookupCompleted] =
    useState<boolean>(false);
  const [communityAnalytics, setCommunityAnalytics] = useState<Stats>();
  const user = useUserStore();

  const getCommunityAnalytics = (communityId: string) => {
    axios
      .get(`${SERVER_URL}/admin/analytics?community_id=${communityId}`, {
        params: {
          auth: true,
          jwt: user.jwt,
        },
      })
      .then((response) => {
        setCommunityLookupCompleted(true);
        setCommunityAnalytics(response.data.result.totalStats);
      })
      .catch((error) => {
        console.log(error);
        notifyError('Error fetching community analytics');
      });
  };

  useNecessaryEffect(() => {
    // Fetch global analytics on load
    const fetchAnalytics = async () => {
      axios
        .get(`${SERVER_URL}/admin/analytics`, {
          params: {
            auth: true,
            jwt: user.jwt,
          },
        })
        .then((response) => {
          setLastMonthNewCommunities(
            response.data.result.lastMonthNewCommunities,
          );
          setGlobalStats(response.data.result.totalStats);
        })
        .catch((error) => {
          console.error(error);
        });
    };

    if (!initialized) {
      fetchAnalytics().then(() => {
        setInitialized(true);
      });
    }
  }, [initialized]);

  return (
    <div className="Analytics">
      {!initialized ? (
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
                  {globalStats?.numThreadsLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">Total Comments</CWText>
                <CWText className="StatValue">
                  {globalStats?.numCommentsLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">Total Reactions</CWText>
                <CWText className="StatValue">
                  {globalStats?.numReactionsLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">Total Polls</CWText>
                <CWText className="StatValue">
                  {globalStats?.numPollsLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">Total Votes</CWText>
                <CWText className="StatValue">
                  {globalStats?.numProposalVotesLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">Total New Addresses</CWText>
                <CWText className="StatValue">
                  {globalStats?.numMembersLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">Total New Groups</CWText>
                <CWText className="StatValue">
                  {globalStats?.numGroupsLastMonth}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">
                  Average Addresses Per Community
                </CWText>
                <CWText className="StatValue">
                  {/*@ts-expect-error StrictNullChecks*/}
                  {Math.round(globalStats?.averageAddressesPerCommunity)}
                </CWText>
              </div>
              <div className="Stat">
                <CWText fontWeight="medium">
                  {'Total Communities with > 2 addresses'}
                </CWText>
                <CWText className="StatValue">
                  {/* @ts-expect-error StrictNullChecks*/}
                  {Math.round(globalStats?.populatedCommunities)}
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
            {communityAnalytics && communityLookupCompleted && (
              <div className="Stats">
                <div className="Stat">
                  <CWText fontWeight="medium">Total Threads</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.numThreadsLastMonth}
                  </CWText>
                </div>
                <div className="Stat">
                  <CWText fontWeight="medium">Total Comments</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.numCommentsLastMonth}
                  </CWText>
                </div>
                <div className="Stat">
                  <CWText fontWeight="medium">Total Reactions</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.numReactionsLastMonth}
                  </CWText>
                </div>
                <div className="Stat">
                  <CWText fontWeight="medium">Total Polls</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.numPollsLastMonth}
                  </CWText>
                </div>
                <div className="Stat">
                  <CWText fontWeight="medium">Total Votes</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.numProposalVotesLastMonth}
                  </CWText>
                </div>
                <div className="Stat">
                  <CWText fontWeight="medium">Total New Addresses</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.numMembersLastMonth}
                  </CWText>
                </div>
                <div className="Stat">
                  <CWText fontWeight="medium">Total New Groups</CWText>
                  <CWText className="StatValue">
                    {communityAnalytics?.numGroupsLastMonth}
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
              {lastMonthNewCommunties &&
                lastMonthNewCommunties?.map((community) => {
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
