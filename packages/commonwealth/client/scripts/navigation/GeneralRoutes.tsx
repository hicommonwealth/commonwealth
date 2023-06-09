import { Route } from 'react-router-dom';
import React, { lazy } from 'react';
import { withLayout } from 'views/Layout';

const TermsPage = lazy(() => import('views/pages/terms'));
const PrivacyPage = lazy(() => import('views/pages/privacy'));
const ComponentsPage = lazy(() => import('views/pages/components'));

const GeneralRoutes = (isAppLoading: boolean) => [
  <Route path="/terms" element={withLayout(TermsPage, { isAppLoading })} />,
  <Route path="/privacy" element={withLayout(PrivacyPage, { isAppLoading })} />,
  <Route
    path="/components"
    element={withLayout(ComponentsPage, { hideSidebar: true, isAppLoading })}
  />,
];

export default GeneralRoutes;
