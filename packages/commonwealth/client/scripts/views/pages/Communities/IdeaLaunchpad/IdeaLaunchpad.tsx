import { useFlag } from 'hooks/useFlag';
import React, { useState } from 'react';
import LaunchIdeaCard from '../../../components/LaunchIdeaCard';
import TokenLaunchDrawer from './TokenLaunchDrawer';

const IdeaLaunchpad = () => {
  const tokenizedCommunityEnabled = useFlag('tokenizedCommunity');

  const [isTokenLaunchDrawerOpen, setIsTokenLaunchDrawerOpen] = useState(false);

  if (!tokenizedCommunityEnabled) return <></>;

  return (
    <>
      <LaunchIdeaCard
        onRandomizeClick={() => setIsTokenLaunchDrawerOpen(true)}
        onTokenLaunchClick={() => setIsTokenLaunchDrawerOpen(true)}
      />
      <TokenLaunchDrawer
        isOpen={isTokenLaunchDrawerOpen}
        onClose={() => setIsTokenLaunchDrawerOpen(false)}
      />
    </>
  );
};

export default IdeaLaunchpad;
