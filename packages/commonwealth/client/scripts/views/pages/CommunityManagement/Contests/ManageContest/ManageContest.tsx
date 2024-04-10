import React, { useState } from 'react';

import app from 'state';
import Permissions from 'utils/Permissions';
import { CWText } from 'views/components/component_kit/cw_text';
import { PageNotFound } from 'views/pages/404';

import CommunityManagementLayout from '../../common/CommunityManagementLayout';
import {
  ContestLiveStep,
  DetailsFormStep,
  SignTransactionsStep,
} from './steps';

import './ManageContest.scss';

interface ManageContestProps {
  contestId?: string;
}

export type LaunchContestStep =
  | 'DetailsForm'
  | 'SignTransactions'
  | 'ContestLive';

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

  return (
    <CommunityManagementLayout
      title="Launch a contest"
      description={
        <CWText className="contest-description">
          Launch a contest using the funds from your community wallet to create
          engagement incentives.{' '}
          <CWText fontWeight="medium">Contests last 7 days</CWText> in
          blockchain time. <a href="https://blog.commonwealth.im">Learn more</a>
        </CWText>
      }
      featureHint={{
        title: 'How do I fund my contest?',
        description:
          'Contests are funded when community members purchase stake in the community. ' +
          'Each transaction includes a small contribution to the community pool that can be used to fund contests.',
      }}
    >
      <div className="ManageContest">{getCurrentStep()}</div>
    </CommunityManagementLayout>
  );
};

export default ManageContest;
