import { MoonPayProvider as MoonPayProviderComponent } from '@moonpay/moonpay-react';
import { fetchCachedPublicEnvVar } from 'client/scripts/state/api/configuration';
import React from 'react';

const MoonPayProvider = ({ children }: { children: React.ReactNode }) => {
  const configurationData = fetchCachedPublicEnvVar();

  return (
    <MoonPayProviderComponent
      apiKey={configurationData?.MOONPAY_PUBLISHABLE_KEY || ''}
      debug
    >
      {children}
    </MoonPayProviderComponent>
  );
};

export default MoonPayProvider;
