import { useFlag } from 'client/scripts/hooks/useFlag';
import Permissions from 'client/scripts/utils/Permissions';
import React from 'react';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../../404';

import './OnchainVerificationIntegration.scss';

const OnchainVerificationIntegration = () => {
  const user = useUserStore();

  const isJudgementEnabled = useFlag('judgeContest');

  if (
    !user.isLoggedIn ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin()) ||
    !isJudgementEnabled
  ) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <section className="OnchainVerificationIntegration">
        <CWText type="h2">Onchain Verification</CWText>
        <CWText type="b1">
          This page will allow you to manage onchain verification for your
          community.
        </CWText>
      </section>
    </CWPageLayout>
  );
};

export default OnchainVerificationIntegration;
