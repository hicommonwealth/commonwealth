import React from 'react';
import AuthButton from 'views/components/AuthButton';
import { CWText } from 'views/components/component_kit/cw_text';

const AuthButtonsShowcase = () => {
  return (
    <>
      <CWText type="h5">Regular</CWText>
      <div className="flex-row">
        <AuthButton type="walletconnect" />
        <AuthButton type="keplr" />
        <AuthButton type="leap" />
        <AuthButton type="github" />
        <AuthButton type="google" />
        <AuthButton type="discord" />
        <AuthButton type="x" />
        <AuthButton type="email" />
      </div>
      <CWText type="h5">Disabled</CWText>
      <div className="flex-row">
        <AuthButton type="walletconnect" disabled />
        <AuthButton type="keplr" disabled />
      </div>
      <CWText type="h5">No wallet extension</CWText>
      <div className="flex-row">
        <AuthButton type="NO_WALLETS_FOUND" disabled />
      </div>
    </>
  );
};

export default AuthButtonsShowcase;
