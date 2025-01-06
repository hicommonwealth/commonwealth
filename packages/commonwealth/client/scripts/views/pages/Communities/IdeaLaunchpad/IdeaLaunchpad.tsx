import { ChainBase } from '@hicommonwealth/shared';
import useDeferredConditionTriggerCallback from 'hooks/useDeferredConditionTriggerCallback';
import { useFlag } from 'hooks/useFlag';
import React, { useState } from 'react';
import useUserStore from 'state/ui/user';
import { AuthModal } from 'views/modals/AuthModal';
import LaunchIdeaCard from '../../../components/LaunchIdeaCard';
import TokenLaunchDrawer from './TokenLaunchDrawer';

const IdeaLaunchpad = () => {
  const user = useUserStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const tokenizedCommunityEnabled = useFlag('tokenizedCommunity');

  const [initialIdeaPrompt, setInitialIdeaPrompt] = useState<string>();
  const [shouldGenerateIdeaOnDrawerOpen, setShouldGenerateIdeaOnDrawerOpen] =
    useState(false);
  const [isTokenLaunchDrawerOpen, setIsTokenLaunchDrawerOpen] = useState(false);

  const { register, trigger } = useDeferredConditionTriggerCallback({
    shouldRunTrigger: user.isLoggedIn,
  });

  const openAuthModalOrTriggerCallback = () => {
    if (user.isLoggedIn) {
      trigger();
    } else {
      setIsAuthModalOpen(!user.isLoggedIn);
    }
  };

  if (!tokenizedCommunityEnabled) return <></>;

  return (
    <>
      <LaunchIdeaCard
        onRandomizeClick={(ideaPrompt) => {
          register({
            cb: (prompt: string) => {
              setInitialIdeaPrompt(prompt);
              setShouldGenerateIdeaOnDrawerOpen(true);
              setIsTokenLaunchDrawerOpen(true);
            },
            args: ideaPrompt,
          });
          openAuthModalOrTriggerCallback();
        }}
        onTokenLaunchClick={() => {
          register({ cb: () => setIsTokenLaunchDrawerOpen(true) });
          openAuthModalOrTriggerCallback();
        }}
      />
      <TokenLaunchDrawer
        isOpen={isTokenLaunchDrawerOpen}
        onClose={() => setIsTokenLaunchDrawerOpen(false)}
        initialIdeaPrompt={initialIdeaPrompt}
        generateIdeaOnMount={shouldGenerateIdeaOnDrawerOpen}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        showWalletsFor={ChainBase.Ethereum}
      />
    </>
  );
};

export default IdeaLaunchpad;
