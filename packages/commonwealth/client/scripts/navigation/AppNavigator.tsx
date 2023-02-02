/* @jsx jsx */

import { jsx } from 'mithrilInterop';

import React from 'react';
import { Routes } from 'react-router-dom';

import getGeneralRoutes from 'navigation/generalRoutes';
import getCommonDomainsRoutes from 'navigation/commonDomainRoutes'; // generalRoutes,

type AppNavigatorProps = {
  customDomain: string | null;
};

const AppNavigator = ({ customDomain }: AppNavigatorProps) => {
  console.log('customDomain', customDomain);
  return (
    <Routes>
      {getGeneralRoutes()}
      {getCommonDomainsRoutes()}
      {/*// TODO add custom domain doutes*/}
    </Routes>
  );
};

export default AppNavigator;
