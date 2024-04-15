import React, { useState } from 'react';

import app from 'state';
import Permissions from 'utils/Permissions';
import { PageNotFound } from 'views/pages/404';

import {
  ContestLiveStep,
  DetailsFormStep,
  SignTransactionsStep,
} from './steps';
import { LaunchContestStep } from './types';

import './ManageContest.scss';

interface ManageContestProps {
  contestId?: string;
}

const ManageContest = ({ contestId }: ManageContestProps) => {
  const [launchContestStep, setLaunchContestStep] =
    useState<LaunchContestStep>('DetailsForm');

  if (
    !app.isLoggedIn() ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())
  ) {
    return <PageNotFound />;
  }

  const getCurrentStep = () => {
    switch (launchContestStep) {
      case 'DetailsForm':
        return (
          <DetailsFormStep
            contestId={contestId}
            onSetLaunchContestStep={setLaunchContestStep}
          />
        );

      case 'SignTransactions':
        return (
          <SignTransactionsStep onSetLaunchContestStep={setLaunchContestStep} />
        );

      case 'ContestLive':
        return <ContestLiveStep />;
    }
  };

  return <div className="ManageContest">{getCurrentStep()}</div>;
};

export default ManageContest;
