import { useFlag } from 'client/scripts/hooks/useFlag';
import Permissions from 'client/scripts/utils/Permissions';
import { notifySuccess } from 'controllers/app/notifications';
import AddressInfo from 'models/AddressInfo';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../../404';
import CommunityOnchainTransactions from '../../CreateCommunity/steps/CommunityOnchainTransactions';
import { TransactionType } from '../../CreateCommunity/steps/CommunityOnchainTransactions/helpers/transactionUtils';

import './OnchainVerificationIntegration.scss';

const OnchainVerificationIntegration = () => {
  const user = useUserStore();
  const navigate = useCommonNavigate();
  const isJudgementEnabled = useFlag('judgeContest');
  const [isTransactionComplete, setIsTransactionComplete] = useState(false);

  const communityId = app.activeChainId();

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId || '',
    includeNodeInfo: true,
  });

  const communityChainId = String(community?.ChainNode?.eth_chain_id);

  const selectedAddress =
    user.activeAccount &&
    ({
      ...user.activeAccount,
      userId: user.id,
    } as AddressInfo);

  if (
    !user.isLoggedIn ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin()) ||
    !isJudgementEnabled
  ) {
    return <PageNotFound />;
  }

  const handleVerificationSuccess = () => {
    setIsTransactionComplete(true);
    notifySuccess('Verification token has been minted successfully!');
  };

  const handleTransactionCancel = () => {
    navigate('/manage/integrations');
  };

  return (
    <CWPageLayout>
      <section className="OnchainVerificationIntegration">
        <CWText type="h2">Onchain Verification</CWText>
        <CWText type="b1" className="description">
          This page allows you to mint a verification token for your community.
          <br />A verification token proves that your community is verified
          on-chain.
        </CWText>

        {communityId && selectedAddress && communityChainId && (
          <CommunityOnchainTransactions
            createdCommunityName={community?.name}
            createdCommunityId={communityId}
            selectedAddress={selectedAddress}
            chainId={communityChainId}
            transactionTypes={[
              TransactionType.DeployNamespace,
              TransactionType.ConfigureVerification,
              TransactionType.MintVerificationToken,
            ]}
            namespace={community?.namespace}
            onConfirmNamespaceDataStepCancel={handleTransactionCancel}
            onSignTransaction={(type) => {
              if (type === TransactionType.MintVerificationToken) {
                handleVerificationSuccess();
              }
            }}
            onSignTransactionsStepCancel={handleTransactionCancel}
          />
        )}

        {isTransactionComplete && (
          <div className="success-message">
            <CWText type="h4">Verification Complete!</CWText>
            <CWText type="b1">
              Your community now has a verification token minted on-chain.
            </CWText>
          </div>
        )}
      </section>
    </CWPageLayout>
  );
};

export default OnchainVerificationIntegration;
