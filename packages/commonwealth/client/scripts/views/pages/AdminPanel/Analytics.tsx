import { notifySuccess, notifyError } from 'controllers/app/notifications';
import React, { useEffect, useState } from 'react';
import app from 'state';
import $ from 'jquery';

import 'pages/AdminPanel.scss';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';

const Analytics = () => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [lastMonthNewCommunties, setLastMonthNewCommunities] = useState<
    string[]
  >([]);

  const getCommunityAnalytics = async (chainId: string) => {
    await $.ajax({
      type: 'POST',
      url: `${app.serverUrl()}/communitySpecificAnalytics`,
      data: {
        chain: chainId,
      },
      success: (response) => {
        console.log({ uh: response });
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
          console.log('what', response.result);
          setLastMonthNewCommunities(response.result.lastMonthNewCommunities);
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

  console.log({ lastMonthNewCommunties });

  return (
    <div className="Analytics">
      {!initialized ? (
        <CWSpinner />
      ) : (
        <div className="AnalyticsSection">
          <CWText type="h4">New Communities (Last Month)</CWText>
          <CWText type="caption">
            The chainIds of all communities created in the last month
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
                  >
                    {community}
                  </CWText>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
