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
      const ctx = await FrameSDK.context;
      setFarcasterFrameContext(ctx);
      FrameSDK.actions.ready();
    };
    load();
  }, [setFarcasterFrameContext]);

  return <>{children}</>;
};

export default FarcasterFrameProvider;
