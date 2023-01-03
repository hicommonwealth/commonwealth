import React, { useEffect } from 'react';
import { Routes, Route, Outlet, Link, BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import { Layout } from 'views/layout';
import { initAppState } from 'app';
import DiscussionsPage from 'views/pages/discussions';
import mixpanel from 'mixpanel-browser';

const MIXPANEL_DEV_TOKEN = '312b6c5fadb9a88d98dc1fb38de5d900';
const MIXPANEL_PROD_TOKEN = '993ca6dd7df2ccdc2a5d2b116c0e18c5';

function Home() {
  return (
    <div>
      <h2>Home</h2>
    </div>
  );
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}

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

  useEffect(() => {
    try {
      if (
        document.location.host.startsWith('localhost') ||
        document.location.host.startsWith('127.0.0.1')
      ) {
        mixpanel.init(MIXPANEL_DEV_TOKEN, { debug: true });
      } else {
        // Production Mixpanel Project
        mixpanel.init(MIXPANEL_PROD_TOKEN, { debug: true });
      }
    } catch (e) {
      console.error('Mixpanel initialization error');
    }
  }, []);

  return { loading, customDomain };
};

const App = () => {
  const { loading, customDomain } = useInitApp();

  if (loading) {
    return <h1>Loading...</h1>;
  }

  console.log('custom domain', customDomain);

  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <Outlet />
            </div>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route
            path="/:scope/discussions"
            element={
              <Layout params={{ scope: 'ethereum' }}>
                <DiscussionsPage />
              </Layout>
            }
          />
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </div>
  );
};

const rootElement = document.getElementById('react-app');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
