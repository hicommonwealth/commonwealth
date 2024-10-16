import React from 'react';
import SignTokenTransactions from './SignTokenTransactions';
import { SignatureStepProps } from './types';

const SignatureStep = ({
  goToSuccessStep,
  createdCommunityId,
  selectedAddress,
  baseNode,
  tokenInfo,
}: SignatureStepProps) => {
  return (
    <div className="SignatureStep">
      <SignTokenTransactions
        onSuccess={() => goToSuccessStep(true)}
        onCancel={() => goToSuccessStep(false)}
        selectedAddress={selectedAddress}
        createdCommunityId={createdCommunityId}
        baseNode={baseNode}
        tokenInfo={tokenInfo}
      />
    </div>
  );
};

export default SignatureStep;
