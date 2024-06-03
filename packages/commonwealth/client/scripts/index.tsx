import React from 'react';
import { createRoot } from 'react-dom/client';

import 'index.scss';
import 'react-toastify/dist/ReactToastify.css';
import 'shared.scss';
import '../../static/fonts/fonts.css';
import '../styles/normalize.css'; // reset

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

if (import.meta.hot) {
  import.meta.hot.accept();
}
