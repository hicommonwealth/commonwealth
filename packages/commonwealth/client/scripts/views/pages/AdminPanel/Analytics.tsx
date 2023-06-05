import { notifyError } from 'controllers/app/notifications';
import React, { useEffect, useState } from 'react';
import app from 'state';
import $ from 'jquery';

import 'pages/AdminPanel.scss';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';
import { ValidationStatus } from '../../components/component_kit/cw_validation_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWButton } from '../../components/component_kit/cw_button';

const Analytics = () => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [lastMonthNewCommunties, setLastMonthNewCommunities] = useState<
    string[]
  >([]);
  const [globalStats, setGlobalStats] = useState<{
    numCommentsLastMonth: number;
    numThreadsLastMonth: number;
    numPollsLastMonth: number;
    numReactionsLastMonth: number;
    numProposalVotesLastMonth: number;
    numMembersLastMonth: number;
  }>();
  const [chainLookupValue, setChainLookupValue] = useState<string>('');
  const [chainLookupValidated, setChainLookupValidated] =
    useState<boolean>(false);
  const [chainLookupCompleted, setChainLookupCompleted] =
    useState<boolean>(false);
  const [communityAnalytics, setCommunityAnalytics] = useState<{
    numCommentsLastMonth: number;
    numThreadsLastMonth: number;
    numPollsLastMonth: number;
    numReactionsLastMonth: number;
    numProposalVotesLastMonth: number;
    numMembersLastMonth: number;
  }>();

  const getCommunityAnalytics = async (chainId: string) => {
    await $.ajax({
      type: 'POST',
      url: `${app.serverUrl()}/communitySpecificAnalytics`,
      data: {
        chain: chainId,
      },
      success: (response) => {
        setChainLookupCompleted(true);
        setCommunityAnalytics(response.result);
      },
      error: (e) => {
        console.log(e);
        notifyError('Error fetching community analytics');
      },
    });
  };

  useEffect(() => {
    // Fetch global analytics on load
    const fetchAnalytics = async () => {
      await $.ajax({
        type: 'GET',
        url: `${app.serverUrl()}/adminAnalytics`,
        headers: {
          'content-type': 'application/json',
        },
        success: (response) => {
          setLastMonthNewCommunities(response.result.lastMonthNewCommunities);
          setGlobalStats(response.result.totalStats);
        },
      });
    };

    const timerId = setTimeout(() => {
      if (!initialized) {
        fetchAnalytics().then(() => {
          setInitialized(true);
        });
      }
    });

    return () => clearTimeout(timerId);
  }, [initialized]);

  const validationFn = (value: string): [ValidationStatus, string] | [] => {
    if (!value || !app.config.chains.getById(value)) {
      setChainLookupCompleted(false);
      setChainLookupValidated(false);
      return ['failure', 'Community not found'];
    }
    setChainLookupValidated(true);
    return [];
  };

  const onInput = (e) => {
    setChainLookupValue(e.target.value);
    if (e.target.value.length === 0) {
      setChainLookupValidated(false);
      setChainLookupCompleted(false);
    }
  };

  return (
    <div className="Analytics">
      {!initialized ? (
        <CWSpinner />
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
            </div>
          </div>
          <div className="AnalyticsSection">
            <CWText type="h4">Community Lookup</CWText>
            <CWText type="caption">
              Search for 30 day analytics from a specific community.
            </CWText>
            <div className="Row">
              <CWTextInput
                value={chainLookupValue}
                onInput={onInput}
                inputValidationFn={validationFn}
                placeholder="Enter a community id"
              />
              <CWButton
                label="Search"
                className="TaskButton"
                disabled={!chainLookupValidated}
                onClick={async () => {
                  await getCommunityAnalytics(chainLookupValue);
                }}
              />
            </div>
            {chainLookupValidated && chainLookupCompleted && (
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
              </div>
            )}
          </div>
          <div className="AnalyticsSection">
            <CWText type="h4">New Communities (Last Month)</CWText>
            <CWText type="caption">
              The ids of all communities created in the last month
            </CWText>
            <div className="AnalyticsList">
              {lastMonthNewCommunties &&
                lastMonthNewCommunties?.map((community) => {
                  return (
                    <CWText
                      onClick={() => {
                        window.open(`/${community}`, '_blank');
                      }}
                      className="CommunityName"
                      key={community}
                    >
                      {community}
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
