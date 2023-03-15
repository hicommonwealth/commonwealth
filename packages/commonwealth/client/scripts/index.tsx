import React from 'react';
import { createRoot } from 'react-dom/client';

import '../../static/fonts/fonts.css';
import '../styles/normalize.css'; // reset
import '../styles/tailwind_reset.css'; // for the landing page
import '../styles/shared.scss';
import 'lity/dist/lity.min.css';
import 'react-toastify/dist/ReactToastify.css';

import App from './app';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App />);
