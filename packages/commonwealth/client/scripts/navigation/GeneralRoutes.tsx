import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { withLayout } from 'views/Layout';

const TermsPage = lazy(() => import('views/pages/terms'));
const OldTermsPage = lazy(() => import('views/pages/old_terms'));
const PrivacyPage = lazy(() => import('views/pages/privacy'));
const ComponentsPage = lazy(() => import('views/pages/components'));

const GeneralRoutes = () => [
  <Route path="/terms" element={withLayout(TermsPage, { type: 'common' })} />,
  <Route
    path="/privacy"
    element={withLayout(PrivacyPage, { type: 'common' })}
  />,
  <Route
    path="/tos-1-26-2023"
    element={withLayout(OldTermsPage, { type: 'common' })}
  />,
  <Route
    path="/components"
    element={withLayout(ComponentsPage, { type: 'common' })}
  />,
];

export default GeneralRoutes;
