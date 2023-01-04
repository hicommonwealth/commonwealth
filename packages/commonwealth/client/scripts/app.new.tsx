import React, { useEffect } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import { Layout } from 'views/layout';
import { initAppState } from 'app';
import DiscussionsPage from 'views/pages/discussions';
import WhyCommonwealthPage from 'views/pages/why_commonwealth';
import { PageNotFound } from 'views/pages/404';

// TODO: This file is POC for now but this hook below and components should be placed in separate file
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
    <Routes>
      <Route path="/whyCommonwealth" element={<WhyCommonwealthPage />} />
      <Route path="/about" element={<div>about</div>} />
      {/* TODO this route does not work for now */}
      <Route
        path="/:scope/discussions"
        element={
          <Layout params={{ scope: 'ethereum' }}>
            <DiscussionsPage />
          </Layout>
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const rootElement = document.getElementById('root');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

declare const module: any; // tslint:disable-line no-reserved-keywords
if (module.hot) {
  module.hot.accept();
}
