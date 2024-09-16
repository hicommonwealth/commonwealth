import { Container, Separator, Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Route,
  RouterProvider,
  Routes,
  createBrowserRouter,
} from 'react-router-dom';

import Navbar from './components/Navbar.js';
import HomePage from './home/HomePage.js';
import './index.css';
import Topic from './topic/Topic.js';

const router = createBrowserRouter([
  {
    path: '/*',
    element: (
      <Theme>
        <Container>
          <Navbar />
          <Separator size="4" />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/topic/:topic" element={<Topic />} />
          </Routes>
        </Container>
      </Theme>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
