import { Route } from 'react-router-dom';
import React, { lazy } from 'react';
import { withLayout } from 'views/layout';

const LandingPage = lazy(() => import('views/pages/landing'));
const TermsPage = lazy(() => import('views/pages/terms'));
const PrivacyPage = lazy(() => import('views/pages/privacy'));
const CreateCommunityPage = lazy(() => import('views/pages/create_community'));
const ComponentsPage = lazy(() => import('views/pages/components'));

const generalRoutes = () => [
  <Route
    index
    element={withLayout(LandingPage, {
      scoped: false,
      hideSidebar: false,
    })}
  />,
  <Route path="/terms" element={withLayout(TermsPage, {})} />,
  <Route path="/privacy" element={withLayout(PrivacyPage, {})} />,
  <Route
    path="/createCommunity"
    element={withLayout(CreateCommunityPage, {})}
  />,
  <Route
    path="/components"
    element={withLayout(ComponentsPage, { hideSidebar: true })}
  />,
];

export default generalRoutes;
