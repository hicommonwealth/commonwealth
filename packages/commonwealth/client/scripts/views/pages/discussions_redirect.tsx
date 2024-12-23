/* eslint-disable react/function-component-definition */
import React, { useEffect } from 'react';
import { NavigateOptions, useLocation } from 'react-router-dom';

import { DefaultPage } from '@hicommonwealth/shared';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { PageLoading } from './loading';

export default function DiscussionsRedirect() {
  const navigate = useCommonNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!app.chain) return;

    const searchParams = new URLSearchParams(location.search);
    // Remove 'tab' if it exists as we'll be setting it explicitly
    searchParams.delete('tab');
    const existingParams = searchParams.toString();
    const additionalParams = existingParams ? `&${existingParams}` : '';

    const view = app.chain.meta?.default_summary_view
      ? DefaultPage.Overview
      : DefaultPage.Discussions;

    // Note that because this is a redirect, we do not add it to the history. If we only keep the original URL
    // in history, when something like the back button is clicked, it will not come back to this redirect.
    const dontAddHistory: NavigateOptions = { replace: true };
    switch (view) {
      case DefaultPage.Overview:
        navigate(`/overview?tab=overview${additionalParams}`, dontAddHistory);
        break;
      case DefaultPage.Discussions:
        navigate(`/discussions?tab=all${additionalParams}`, dontAddHistory);
        break;
      default:
        navigate(`/discussions?tab=all${additionalParams}`, dontAddHistory);
    }
  }, [navigate, location.search]);

  return <PageLoading />;
}
