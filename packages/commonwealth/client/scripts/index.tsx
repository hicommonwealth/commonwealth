import React from 'react';
import { createRoot } from 'react-dom/client';

import 'react-toastify/dist/ReactToastify.css';
import './styles/fonts.css';
import './styles/index.scss';
import './styles/normalize.css'; // reset
import './styles/shared.scss';

import App from './App';
import { getBrowserInfo } from './helpers/browser';

const container = document.getElementById('root');
// @ts-expect-error <StrictNullChecks/>
const root = createRoot(container);

root.render(<App />);

// add browser info as classlist to body tag, ex: class="{browser}_{platform}_{version}"
const browserInfo = getBrowserInfo();
const sanitizedName = browserInfo.name
  .toLowerCase()
  .split(' ')
  .join('_')
  .trim();
document.body.classList.add(
  `${sanitizedName}_${browserInfo.isMobile ? 'mobile' : 'web'}_${
    browserInfo.version
  }`,
);
