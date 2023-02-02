/* jsx jsx */

import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';

import { PageLoading } from 'views/pages/loading';
import { Layout } from 'views/layout';
const LandingPage = lazy(() => import('views/pages/landing'));
const WhyCommonwealthPage = lazy(() => import('views/pages/why_commonwealth'));

import { initAppState } from 'state';

const LayoutWrapper = ({ Component, params }) => {
  const routerParams = useParams();
  return (
    <Layout params={Object.assign(params, routerParams)}>
      <Component {...routerParams} />
    </Layout>
  );
};

const withLayout = (Component, params) => {
  return <LayoutWrapper Component={Component} params={params} />;
};

const useInitApp = () => {
  const [loading, setLoading] = React.useState(false);
  const [customDomain, setCustomDomain] = React.useState();

  useEffect(() => {
    setLoading(true);
    fetch('/api/domain')
      .then((res) => res.json())
      .then(({ domain }) => setCustomDomain(domain))
      .then(() => initAppState(true, customDomain))
      .catch((err) => console.log('Failed fetching custom domain', err))
      .finally(() => setLoading(false));
  }, []);

  return { loading, customDomain };
};

const App = () => {
  useInitApp();

  return (
    <React.StrictMode>
      <BrowserRouter>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route
              path="/"
              element={withLayout(LandingPage, {
                scoped: false,
                hideSidebar: false,
              })}
            />
            <Route
              path="/whyCommonwealth"
              element={withLayout(WhyCommonwealthPage, {
                scoped: false,
                hideSidebar: true,
              })}
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </React.StrictMode>
  );
};

export default App;
