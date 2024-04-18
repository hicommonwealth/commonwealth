import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import Permissions from 'utils/Permissions';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';

import EmptyContestsList from '../EmptyContestsList';

import './ContestsList.scss';

const mockedContests = [
  { title: 'Contest 1', id: 1 },
  { title: 'Contest 2', id: 2 },
];

const ContestsList = () => {
  const navigate = useCommonNavigate();

  if (
    !app.isLoggedIn() ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())
  ) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <div className="ContestsList">Contests</div>

      {mockedContests.length === 0 ? (
        <EmptyContestsList />
      ) : (
        <>
          <CWButton
            iconLeft="plusPhosphor"
            label="Create contest"
            onClick={() => navigate('/manage/contests/launch')}
          />
          {mockedContests.map((contest) => (
            <CWCard key={contest.id}>
              <CWText>{contest.title}</CWText>
              <CWButton
                label="Edit contest"
                onClick={() => navigate(`/manage/contests/${contest.id}`)}
              />
            </CWCard>
          ))}
        </>
      )}
    </CWPageLayout>
  );
};

export default ContestsList;
