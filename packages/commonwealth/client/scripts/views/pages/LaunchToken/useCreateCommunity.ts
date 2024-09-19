import { useState } from 'react';
import { CreateTokenCommunityStep, handleChangeStep } from './utils';

const useCreateCommunity = () => {
  const [createTokenCommunityStep, setCreateTokenCommunityStep] =
    useState<CreateTokenCommunityStep>(
      CreateTokenCommunityStep.CommunityInformation,
    );

  const onChangeStep = (forward: boolean) => {
    handleChangeStep(
      forward,
      createTokenCommunityStep,
      setCreateTokenCommunityStep,
    );
  };

  return {
    createTokenCommunityStep,
    onChangeStep,
  };
};

export default useCreateCommunity;
