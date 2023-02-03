import React, { useEffect } from 'react';

import app from 'state';
import { useNavigate } from 'react-router-dom';
import { PageLoading } from './loading';

export default function DiscussionsRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    app.chainAdapterReady.on('ready', () => {
      if (!app.chain) return;
      console.log('navigate', app.chain.meta.defaultOverview);
      if (app.chain.meta.defaultOverview) {
        navigate(`/${app.chain.id}/overview`);
        // this.navigateToSubpage('/overview');
      } else {
        navigate(`/${app.chain.id}/discussions`);
        // this.navigateToSubpage('/discussions');
      }
    });
  });

  return <PageLoading />;
}
