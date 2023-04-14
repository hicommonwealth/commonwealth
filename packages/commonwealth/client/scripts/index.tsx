import 'index.scss';

import 'normalize.css'; // reset
import React from 'react';
import { createRoot } from 'react-dom/client';
import 'react-toastify/dist/ReactToastify.css';
import 'shared.scss';
import '../../static/fonts/fonts.css';

import App from './app';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App />);
