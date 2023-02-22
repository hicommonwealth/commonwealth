import React from 'react';

import $ from 'jquery';

import 'pages/analytics/index.scss';

import app from 'state';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { CWText } from '../../components/component_kit/cw_text';
import { CWOverviewCard } from '../../components/component_kit/cw_overview_card';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWButton } from '../../components/component_kit/cw_button';
import { useCommonNavigate } from 'navigation/helpers';
import { OverviewTable } from '../../components/overview_table';

const AnalyticsPage = () => {
  const [totalData, setTotalData] = React.useState<any>();
  const [error, setError] = React.useState<string>();
  const [requested, setRequested] = React.useState<boolean>(false);
  const navigate = useCommonNavigate();

  if (!requested && app.user && app.activeChainId()) {
    setRequested(true);

    $.get(`${app.serverUrl()}/communityStats`, {
      chain: app.activeChainId(),
      jwt: app.user?.jwt,
    })
      .then(({ status, result }) => {
        if (status !== 'Success') {
          setError('Error loading stats');
        } else {
          setTotalData({
            totalComments: +result.totalComments[0].new_items,
            totalRoles: +result.totalRoles[0].new_items,
            totalThreads: +result.totalThreads[0].new_items,
          });
        }
      })
      .catch((err: any) => {
        console.log(error);
        if (err.responseJSON?.error) {
          setError(err.responseJSON.error);
        } else if (err.responseText) {
          setError(err.responseText);
        } else {
          setError('Error loading analytics');
        }
      });
  }

  if (!requested || (!error && !totalData))
    return <PageLoading message="Loading analytics" />;

  if (error) return <ErrorPage message={error} />;

  return (
    <Sublayout>
      <div className="AnalyticsPage">
        <CWText type="h1" fontWeight="semiBold">Analytics</CWText>
        <CWText className="description">Track your community's growth and engagement</CWText>
        <div className="overview-title">
          <CWText type="h2" fontWeight="semiBold">Overview</CWText>
          <CWDropdown
            label=""
            options={[
              { label: 'Last 24 hours', value: 'daily' },
              { label: 'Last 7 days', value: 'weekly' },
              { label: 'Last 2 weeks', value: 'bi-weekly' },
              { label: 'Last 30 days', value: 'monthly' },
              { label: 'All time', value: 'all' },
            ]}
            onSelect={(item) => console.log('Selected option: ', item.label)}
          />
        </div>
        <div className="overview-grid">
          <CWOverviewCard
            title="Total members"
            value={totalData.totalRoles}
            image="/static/img/total-members.png"
          />
          <CWOverviewCard
            title="Active members"
            value={totalData.totalRoles}
            image="/static/img/active-members.png"
          />
          <CWOverviewCard
            title="New members"
            value={totalData.totalRoles}
            image="/static/img/new-members.png"
          />
          <CWOverviewCard
            title="New threads"
            value={totalData.totalThreads}
            image="/static/img/new-threads.png"
          />
          <CWOverviewCard
            title="New comments"
            value={totalData.totalComments}
            image="/static/img/new-comments.png"
          />
          <CWOverviewCard
            title="New likes"
            value={totalData.totalComments}
            image="/static/img/new-likes.png"
          />
        </div>
        <div className="view-table-button-container">
          <CWButton
            label="View table"
            iconRight="arrowRight"
            buttonType="tertiary-blue"
            onClick={() => navigate(`/analytics/table`)}
          />
        </div>
        <div className="highlights">
          <OverviewTable
            title="Trending topics"
            columns={[{
              label: 'Topic Name',
              key: 'topic',
            }, {
              label: 'Posts',
              key: 'posts',
            }, {
              label: 'Comments',
              key: 'comments',
            }]}
            data={[
              {
                topic: 'Topic 1',
                posts: 100,
                comments: 100,
              },
              {
                topic: 'Topic 2',
                posts: 200,
                comments: 200,
              },
              {
                topic: 'Topic 3',
                posts: 300,
                comments: 300,
              },
            ]}
          />
          <OverviewTable
            title="Most active users"
            columns={[{
              label: 'Member',
              key: 'member',
            }, {
              label: 'Posts',
              key: 'posts',
            }, {
              label: 'Comments',
              key: 'comments',
            }]}
            data={[
              {
                member: {
                  iconUrl: app.config.chains.getById(app.activeChainId())?.iconUrl,
                  profileName: 'Member 1',
                  username: 'member1'
                },
                posts: 3,
                comments: 12,
              },
              {
                member: {
                  iconUrl: app.config.chains.getById(app.activeChainId())?.iconUrl,
                  profileName: 'Member 2',
                  username: 'member2'
                },
                posts: 5,
                comments: 20,
              },
              {
                member: {
                  iconUrl: app.config.chains.getById(app.activeChainId())?.iconUrl,
                  profileName: 'Member 3',
                  username: 'member3'
                },
                posts: 1,
                comments: 300,
              },
            ]}
          />
        </div>
      </div>
    </Sublayout>
  );
};

export default AnalyticsPage;
