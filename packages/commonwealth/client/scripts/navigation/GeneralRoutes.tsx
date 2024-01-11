import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { withLayout } from 'views/Layout';

const TermsPage = lazy(() => import('views/pages/terms'));
const OldTermsPage = lazy(() => import('views/pages/old_terms'));
const PrivacyPage = lazy(() => import('views/pages/privacy'));
const ComponentsPage = lazy(() => import('views/pages/components'));
const Testing = lazy(() => import('views/pages/testing'));

const GeneralRoutes = () => [
  <Route
    key="/terms"
    path="/terms"
    element={withLayout(TermsPage, { type: 'common' })}
  />,
  <Route
    key="/privacy"
    path="/privacy"
    element={withLayout(PrivacyPage, { type: 'common' })}
  />,
  <Route
    key="/tos"
    path="/tos-1-26-2023"
    element={withLayout(OldTermsPage, { type: 'blank' })}
  />,
  <Route
    key="/components"
    path="/components"
    element={withLayout(ComponentsPage, { type: 'common' })}
  />,
  <Route
    key="/testing"
    path="/testing"
    element={withLayout(Testing, { type: 'common', scoped: true })}
  />,
];

export default GeneralRoutes;
