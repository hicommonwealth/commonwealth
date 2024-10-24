import { useFlag } from 'hooks/useFlag';
import React, { useState } from 'react';
import LaunchIdeaCard from '../../../components/LaunchIdeaCard';
import TokenLaunchDrawer from './TokenLaunchDrawer';

const IdeaLaunchpad = () => {
  const tokenizedCommunityEnabled = useFlag('tokenizedCommunity');

  const [initialIdeaPrompt, setInitialIdeaPrompt] = useState<string>();
  const [shouldGenerateIdeaOnDrawerOpen, setShouldGenerateIdeaOnDrawerOpen] =
    useState(false);
  const [isTokenLaunchDrawerOpen, setIsTokenLaunchDrawerOpen] = useState(false);

  if (!tokenizedCommunityEnabled) return <></>;

  return (
    <>
      <LaunchIdeaCard
        onRandomizeClick={(ideaPrompt) => {
          setInitialIdeaPrompt(ideaPrompt);
          setShouldGenerateIdeaOnDrawerOpen(true);
          setIsTokenLaunchDrawerOpen(true);
        }}
        onTokenLaunchClick={() => setIsTokenLaunchDrawerOpen(true)}
      />
      <TokenLaunchDrawer
        isOpen={isTokenLaunchDrawerOpen}
        onClose={() => setIsTokenLaunchDrawerOpen(false)}
        initialIdeaPrompt={initialIdeaPrompt}
        generateIdeaOnMount={shouldGenerateIdeaOnDrawerOpen}
      />
    </>
  );
};

export default IdeaLaunchpad;
