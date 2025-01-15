import FrameSDK from '@farcaster/frame-sdk';
import React, { useEffect } from 'react';

const FarcasterFrameProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useEffect(() => {
    const load = async () => {
      FrameSDK.actions.ready();
    };
    load();
  }, []);

  return <>{children}</>;
};

export default FarcasterFrameProvider;
