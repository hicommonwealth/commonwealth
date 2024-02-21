import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { withLayout } from 'views/Layout';

const TermsPage = lazy(() => import('views/pages/terms'));
const OldTermsPage = lazy(() => import('views/pages/old_terms'));
const PrivacyPage = lazy(() => import('views/pages/privacy'));
const ComponentsShowcasePage = lazy(
  () => import('views/pages/ComponentsShowcase'),
);
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
    key="/tos-1-26-2023"
    path="/tos-1-26-2023"
    element={withLayout(OldTermsPage, { type: 'blank' })}
  />,
  <Route
    key="/components-old"
    path="/components-old"
    element={withLayout(ComponentsPage, { type: 'common' })}
  />,
  <Route
    key="/components"
    path="/components"
    element={withLayout(ComponentsShowcasePage, { type: 'common' })}
  />,
  <Route
    key="/testing"
    path="/testing"
    element={withLayout(Testing, { type: 'common', scoped: true })}
  />,
];

export default GeneralRoutes;
