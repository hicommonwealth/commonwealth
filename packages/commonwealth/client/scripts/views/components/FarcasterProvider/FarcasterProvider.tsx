import FrameSDK from '@farcaster/frame-sdk';
import React, { useEffect } from 'react';
import useFarcasterStore from 'state/ui/farcaster';

const FarcasterFrameProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { setFarcasterContext } = useFarcasterStore();

  useEffect(() => {
    const load = async () => {
      const ctx = await FrameSDK.context;
      setFarcasterContext(ctx);
      FrameSDK.actions.ready();
    };
    load();
  }, [setFarcasterContext]);

  return <>{children}</>;
};

export default FarcasterFrameProvider;
