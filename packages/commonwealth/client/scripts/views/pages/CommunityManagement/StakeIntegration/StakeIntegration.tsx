import clsx from 'clsx';
import React from 'react';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../../404';
import './StakeIntegration.scss';
import StakeIntegrationContent from './StakeIntegrationContent';
import useStakeIntegrationData, {
  StakeIntegrationProps,
} from './useStakeIntegrationData';

const StakeIntegration = ({
  isTopicFlow,
  onTopicFlowStepChange,
  onCreateTopic,
}: StakeIntegrationProps) => {
  const data = useStakeIntegrationData({
    isTopicFlow,
    onTopicFlowStepChange,
    onCreateTopic,
  });

  if (!data.contractInfo || !data.isAuthorized) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout className={clsx({ 'topic-stake': isTopicFlow })}>
      <StakeIntegrationContent {...data} />
    </CWPageLayout>
  );
};

export default StakeIntegration;
