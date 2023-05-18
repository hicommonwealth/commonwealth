import React from 'react';
import { createRoot } from 'react-dom/client';

import 'normalize.css'; // reset
import 'shared.scss';
import 'index.scss';
import '../../static/fonts/fonts.css';
import 'react-toastify/dist/ReactToastify.css';

import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App />);
