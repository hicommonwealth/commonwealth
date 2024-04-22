import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import Permissions from 'utils/Permissions';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';

import EmptyContestsList from '../EmptyContestsList';
import ContestCard from './ContestCard';

import './ContestsList.scss';

const mockedContests = [
  {
    id: 1,
    name: 'Degens divided',
    imageUrl: 'https://fakeimg.pl/1200x400',
    finishDate: '2022-01-01',
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111, 0.00011, 0.00222],
  },
  {
    id: 2,
    name: 'Hello world',
    finishDate: '2022-01-01',
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
  },
];

const ContestsList = () => {
  const navigate = useCommonNavigate();

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isStakeEnabled = true;
  const isContestAvailable = true;

  if (!app.isLoggedIn() || !isAdmin) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <div className="ContestsList">
        <CWText type="h2">Contests</CWText>

        {!isStakeEnabled || !isContestAvailable ? (
          <EmptyContestsList
            isStakeEnabled={isStakeEnabled}
            isContestAvailable={isContestAvailable}
          />
        ) : (
          <>
            <CWButton
              iconLeft="plusPhosphor"
              label="Create contest"
              onClick={() => navigate('/manage/contests/launch')}
            />
            {mockedContests.map(
              ({ id, name, imageUrl, finishDate, topics, payouts }) => (
                <ContestCard
                  key={id}
                  isAdmin={isAdmin}
                  id={id}
                  name={name}
                  imageUrl={imageUrl}
                  topics={topics}
                  payouts={payouts}
                  finishDate={finishDate}
                />
              ),
            )}
          </>
        )}
      </div>
    </CWPageLayout>
  );
};

export default ContestsList;
