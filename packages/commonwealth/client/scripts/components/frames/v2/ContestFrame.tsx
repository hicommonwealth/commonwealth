import { FrameSDK } from '@farcaster/frame-sdk';
import React, { useEffect } from 'react';

const ContestFrame: React.FC = () => {
  useEffect(() => {
    const sdk = new FrameSDK();
    sdk.actions.ready();
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#2A2432',
        color: 'white',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        lineHeight: '0.5',
      }}
    >
      <h1 style={{ fontSize: '56px', lineHeight: '1.2' }}>Contest Frame V2</h1>
      <p style={{ fontSize: '32px', lineHeight: '1.2' }}>
        Commonwealth Contest Platform
      </p>
      <p style={{ fontSize: '42px' }}>Check prizes below 👇</p>
    </div>
  );
};

export default ContestFrame;
