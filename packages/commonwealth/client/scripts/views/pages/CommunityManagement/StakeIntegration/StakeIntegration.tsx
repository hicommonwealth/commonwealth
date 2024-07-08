import { commonProtocol } from '@hicommonwealth/shared';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';
import { useCommunityStake } from 'views/components/CommunityStake';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../../404';
import CommunityStakeStep from '../../CreateCommunity/steps/CommunityStakeStep';
import CanBeDisabled from './CanBeDisabled';
import ContractInfo from './ContractInfo';
import './StakeIntegration.scss';
import Status from './Status';

const StakeIntegration = () => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { stakeEnabled, refetchStakeQuery } = useCommunityStake();

  const handleStepChange = () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refetchStakeQuery();
    navigate(`/manage/integrations`);
  };

  const contractInfo =
    // @ts-expect-error <StrictNullChecks/>
    commonProtocol?.factoryContracts[app?.chain?.meta?.ChainNode?.ethChainId];

  if (!contractInfo) {
    return <PageNotFound />;
  }

  const community = app.chain.meta;
  const communityChainId = `${
    community.ChainNode?.ethChainId || community.ChainNode?.cosmosChainId
  }`;
  const selectedAddress = user.addresses.find(
    (x) =>
      x.address === user.activeAccount?.address &&
      x.community.id === community.id,
  );

  return (
    <CWPageLayout>
      <section className="StakeIntegration">
        <CWText type="h2">Stake</CWText>
        <Status communityName={app.activeChainId()} isEnabled={stakeEnabled} />
        <CWDivider />
        {stakeEnabled ? (
          <>
            <ContractInfo
              contractAddress={contractInfo?.factory}
              smartContractAddress={contractInfo?.communityStake}
              voteWeightPerStake="1"
            />
            <CWDivider />
            <CanBeDisabled />
          </>
        ) : (
          <CommunityStakeStep
            goToSuccessStep={handleStepChange}
            createdCommunityName={community?.name}
            createdCommunityId={community?.id}
            // @ts-expect-error <StrictNullChecks/>
            selectedAddress={selectedAddress}
            chainId={communityChainId}
          />
        )}
      </section>
    </CWPageLayout>
  );
};

export default StakeIntegration;
