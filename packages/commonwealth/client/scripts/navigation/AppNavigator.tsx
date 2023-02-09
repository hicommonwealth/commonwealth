import React from 'react';
import { Routes } from 'react-router-dom';

import getGeneralRoutes from 'navigation/generalRoutes';
import getCommonDomainsRoutes from 'navigation/commonDomainRoutes';

type AppNavigatorProps = {
  customDomain: string | null;
};

const AppNavigator = ({ customDomain }: AppNavigatorProps) => {
  console.log('customDomain', customDomain);
  return (
    <Routes>
      {getGeneralRoutes()}
      {getCommonDomainsRoutes()}
      {/*// TODO add custom domain routes*/}
    </Routes>
  );
};

export default AppNavigator;
