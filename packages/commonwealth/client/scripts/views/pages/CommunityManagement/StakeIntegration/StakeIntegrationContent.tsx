import AddressInfo from 'client/scripts/models/AddressInfo';
import React from 'react';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWDivider } from '../../../components/component_kit/cw_divider';
import { CWText } from '../../../components/component_kit/cw_text';
import CommunityOnchainTransactions from '../../CreateCommunity/steps/CommunityOnchainTransactions';
import { TransactionType } from '../../CreateCommunity/steps/CommunityOnchainTransactions/helpers';
import CanBeDisabled from './CanBeDisabled';
import ContractInfo from './ContractInfo';
import Status from './Status';
import type { StakeIntegrationData } from './useStakeIntegrationData';

const StakeIntegrationContent = ({
  community,
  communityChainId,
  contractInfo,
  createTopicHandler,
  goBack,
  handleStakeConfigured,
  isTopicFlow,
  selectedAddress,
  stakeEnabled,
}: StakeIntegrationData) => {
  return (
    <section className="StakeIntegration">
      <CWText type="h2">Stake</CWText>
      <Status communityName={community?.name || ''} isEnabled={stakeEnabled} />
      <CWDivider />
      {stakeEnabled ? (
        <>
          <ContractInfo
            contractAddress={contractInfo?.NamespaceFactory}
            smartContractAddress={contractInfo?.CommunityStake}
            voteWeightPerStake="1"
            namespace={community?.namespace}
            symbol={community?.default_symbol}
          />
          <CWDivider />
          <CanBeDisabled />
          {isTopicFlow && (
            <>
              <CWDivider />

              <section className="action-buttons">
                <CWButton
                  type="button"
                  label="Back"
                  buttonWidth="wide"
                  buttonType="secondary"
                  onClick={goBack}
                />
                <CWButton
                  type="button"
                  label="Create topic with stakes"
                  buttonWidth="wide"
                  onClick={createTopicHandler}
                />
              </section>
            </>
          )}
        </>
      ) : (
        <CommunityOnchainTransactions
          createdCommunityName={community?.name}
          createdCommunityId={community?.id || ''}
          namespace={community?.namespace}
          symbol={community?.default_symbol}
          selectedAddress={selectedAddress as AddressInfo}
          chainId={communityChainId}
          transactionTypes={[
            TransactionType.DeployNamespace,
            TransactionType.ConfigureStakes,
          ]}
          isTopicFlow={isTopicFlow}
          onConfirmNamespaceDataStepCancel={goBack}
          onSignTransaction={(type) => {
            if (type === TransactionType.ConfigureStakes) {
              handleStakeConfigured();
            }
          }}
          onSignTransactionsStepCancel={goBack}
        />
      )}
    </section>
  );
};

export default StakeIntegrationContent;
