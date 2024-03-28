import React from 'react';
import { createRoot } from 'react-dom/client';

import 'index.scss';
import 'normalize.css'; // reset
import 'react-toastify/dist/ReactToastify.css';
import 'shared.scss';
import '../../static/fonts/fonts.css';

import App from './App';
import { getBrowserInfo } from './helpers/browser';

const container = document.getElementById('root');
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
