import FrameSDK from '@farcaster/frame-sdk';
import React, { useEffect } from 'react';
import useFarcasterStore from 'state/ui/farcaster';

const FarcasterFrameProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { setFarcasterFrameContext } = useFarcasterStore();

  useEffect(() => {
    const load = async () => {
      try {
        const ctx = await FrameSDK.context;
        setFarcasterFrameContext(ctx);
        await FrameSDK.actions.ready();
      } catch (error) {
        console.error('Failed to initialize Farcaster frame:', error);
      }
    };
    load().catch(console.error);
  }, [setFarcasterFrameContext]);

  return <>{children}</>;
};

export default FarcasterFrameProvider;
