import React from 'react';
import { LoginWithFarcaster } from 'views/components/Privy/LoginWithFarcaster';

export const PrivyTest = () => {
  return (
    <div>
      {/*<CodeDialog*/}
      {/*  onComplete={(code: string) => console.log('verify: code: ' + code)}*/}
      {/*  onCancel={() => {}}*/}
      {/*  headerText="Verify your identity"*/}
      {/*/>*/}
      <LoginWithFarcaster />
    </div>
  );
};
