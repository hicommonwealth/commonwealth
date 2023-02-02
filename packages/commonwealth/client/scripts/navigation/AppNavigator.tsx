import React, { lazy, Suspense } from 'react';
import { Route, Routes, useParams } from 'react-router-dom';

import { Layout } from 'views/layout';

type AppNavigatorProps = {
  customDomain: string | null;
};

/*// sitewide pages*/
const LandingPage = lazy(() => import('views/pages/landing'));
const WhyCommonwealthPage = lazy(() => import('views/pages/why_commonwealth'));
const TermsPage = lazy(() => import('views/pages/terms'));
const PrivacyPage = lazy(() => import('views/pages/privacy'));
const CreateCommunityPage = lazy(() => import('views/pages/create_community'));
const ComponentsPage = lazy(() => import('views/pages/components'));
/*// sitewide pages end*/

// COMMON DOMAINS
// COMMON DOMAINS END

// CUSTOM DOMAINS
// CUSTOM DOMAINS END

const LayoutWrapper = ({ Component, params }) => {
  const routerParams = useParams();
  return (
    <Layout params={Object.assign(params, routerParams)}>
      <Component {...routerParams} />
    </Layout>
  );
};

const withLayout = (Component, params) => {
  return (
    <Suspense fallback={null}>
      <LayoutWrapper Component={Component} params={params} />
    </Suspense>
  );
};

const AppNavigator = ({ customDomain }: AppNavigatorProps) => {
  console.log('custom domain', customDomain);
  return (
    <Routes>
      <Route
        index
        element={withLayout(LandingPage, {
          scoped: false,
          hideSidebar: false,
        })}
      />
      <Route
        path="/whyCommonwealth"
        element={withLayout(WhyCommonwealthPage, {})}
      />
      <Route path="/terms" element={withLayout(TermsPage, {})} />
      <Route path="/privacy" element={withLayout(PrivacyPage, {})} />
      <Route
        path="/createCommunity"
        element={withLayout(CreateCommunityPage, {})}
      />
      <Route
        path="/components"
        element={withLayout(ComponentsPage, { hideSidebar: true })}
      />
      {/*// sitewide pages END */}

      {/*// COMMON DOMAINS*/}
      {/*// COMMON DOMAINS END*/}
      {/*// CUSTOM DOMAINS */}
      {/*// CUSTOM DOMAINS END*/}
    </Routes>
  );
};

export default AppNavigator;
