import React from 'react';
import { createRoot } from 'react-dom/client';

import 'normalize.css'; // reset
import 'shared.scss';
import 'index.scss';
import '../../static/fonts/fonts.css';
import 'react-toastify/dist/ReactToastify.css';

import App from './app';

function cordovaReady() {
  (window as any).plugins.safearea.get(successCallback, errorCallback);
}

function successCallback(result) {
  console.log('successCallback called with result:', result);
  // Set CSS variables with the safe area insets
  document.documentElement.style.setProperty('--safe-area-inset-top', result.top + 'px');
  document.documentElement.style.setProperty('--safe-area-inset-right', result.right + 'px');
  document.documentElement.style.setProperty('--safe-area-inset-bottom', result.bottom + 'px');
  document.documentElement.style.setProperty('--safe-area-inset-left', result.left + 'px');
}

function errorCallback(error) {
  console.log('Error:', error);
}

function initApp() {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(<App />);
}

// Check if the app is running in a Cordova environment
if ((window as any).cordova) {
  document.addEventListener("deviceready", () => {
    cordovaReady();
    initApp();
  }, false);
} else {
  // Non-Cordova environment (regular web browser)
  initApp();
}
