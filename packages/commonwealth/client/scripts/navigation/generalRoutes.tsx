import { Route } from 'react-router-dom';
import React, { lazy } from 'react';
import { withLayout } from 'views/layout';

const TermsPage = lazy(() => import('views/pages/terms'));
const PrivacyPage = lazy(() => import('views/pages/privacy'));
const ComponentsPage = lazy(() => import('views/pages/components'));

const generalRoutes = () => [
  <Route path="/terms" element={withLayout(TermsPage, {})} />,
  <Route path="/privacy" element={withLayout(PrivacyPage, {})} />,
  <Route
    path="/components"
    element={withLayout(ComponentsPage, { hideSidebar: true })}
  />,
];

export default generalRoutes;
