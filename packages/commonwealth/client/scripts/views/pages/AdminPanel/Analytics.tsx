import { notifySuccess, notifyError } from 'controllers/app/notifications';
import React, { useEffect, useState } from 'react';
import app from 'state';
import $ from 'jquery';

import 'pages/AdminPanel.scss';

const Analytics = () => {
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      await $.ajax({
        type: 'GET',
        url: `${app.serverUrl()}/adminAnalytics`,
        headers: {
          'content-type': 'application/json',
        },
        success: (response) => {
          console.log({ response });
        },
      });
    };

    const timerId = setTimeout(() => {
      if (!initialized) {
        fetchAnalytics();
        setInitialized(true);
      }
    });

    return () => clearTimeout(timerId);
  }, [initialized]);

  return <div className="Analytics"></div>;
};

export default Analytics;
