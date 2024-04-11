import { commonProtocol } from '@hicommonwealth/shared';
import React, { useState } from 'react';
import app from 'state';
import { useCommunityStake } from 'views/components/CommunityStake';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../../404';
import CanBeDisabled from './CanBeDisabled';
import ContractInfo from './ContractInfo';
import EnableStake from './EnableStake/EnableStake';
import './StakeIntegration.scss';
import Status from './Status';

const StakeIntegration = () => {
  const { stakeEnabled } = useCommunityStake();

  const [isStakeEnabled, setIsStackEnabled] = useState<boolean>(false);

  const contractInfo =
    commonProtocol?.factoryContracts[app?.chain?.meta?.ChainNode?.ethChainId];

  if (!contractInfo) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <section className="StakeIntegration">
        <CWText type="h2">Stake</CWText>
        <Status
          communityName={app.activeChainId()}
          isEnabled={stakeEnabled || isStakeEnabled}
        />
        <CWDivider />
        {stakeEnabled || isStakeEnabled ? (
          <ContractInfo
            contractAddress={contractInfo.factory}
            smartContractAddress={contractInfo.communityStake}
            voteWeightPerStake="1"
          />
        ) : (
          <EnableStake
            ethChainId={contractInfo?.chainId}
            onChangeStep={() => setIsStackEnabled(true)}
          />
        )}
        <CWDivider />
        <CanBeDisabled />
      </section>
    </CWPageLayout>
  );
};

export default StakeIntegration;
