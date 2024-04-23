import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import Permissions from 'utils/Permissions';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';

import EmptyContestsList from '../EmptyContestsList';
import useCommunityContests from '../useCommunityContests';
import ContestCard from './ContestCard';

import './ContestsList.scss';

const ContestsList = () => {
  const navigate = useCommonNavigate();

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const { stakeEnabled, contestsData, isContestAvailable } =
    useCommunityContests();

  if (!app.isLoggedIn() || !isAdmin) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <div className="ContestsList">
        <div className="header-row">
          <CWText type="h2">Contests</CWText>
          <CWButton
            iconLeft="plusPhosphor"
            label="Create contest"
            onClick={() => navigate('/manage/contests/launch')}
          />
        </div>

        {!stakeEnabled || !isContestAvailable ? (
          <EmptyContestsList
            isStakeEnabled={stakeEnabled}
            isContestAvailable={isContestAvailable}
          />
        ) : (
          <div className="list-container">
            {contestsData.map(
              ({
                id,
                name,
                imageUrl,
                finishDate,
                topics,
                payouts,
                isActive,
              }) => (
                <ContestCard
                  key={id}
                  isAdmin={isAdmin}
                  id={id}
                  name={name}
                  imageUrl={imageUrl}
                  topics={topics}
                  payouts={payouts}
                  finishDate={finishDate}
                  isActive={isActive}
                />
              ),
            )}
          </div>
        )}
      </div>
    </CWPageLayout>
  );
};

export default ContestsList;
