import React, { useEffect } from 'react';
import { NavigateOptions } from 'react-router-dom';

import app from 'state';
import { PageLoading } from './loading';
import { DefaultPage } from 'common-common/src/types';
import { useCommonNavigate } from 'navigation/helpers';
import { featureFlags } from 'helpers/feature-flags';

export default function DiscussionsRedirect() {
  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!app.chain) return;

    const { defaultPage, defaultOverview, hasHomepage } = app.chain.meta;
    let view;

    if (featureFlags.communityHomepage && hasHomepage) {
      view = defaultPage;
    } else {
      view = defaultOverview ? DefaultPage.Overview : DefaultPage.Discussions;
    }

    // Note that because this is a redirect, we do not add it to the history. If we only keep the original URL
    // in history, when something like the back button is clicked, it will not come back to this redirect.
    const dontAddHistory: NavigateOptions = { replace: true };

    switch (view) {
      case DefaultPage.Overview:
        navigate('/overview', dontAddHistory);
        break;
      case DefaultPage.Discussions:
        navigate('/discussions', dontAddHistory);
        break;
      case DefaultPage.Homepage:
        navigate('/feed', dontAddHistory);
        break;
      default:
        navigate('/discussions', dontAddHistory);
    }
  }, [navigate]);

  return <PageLoading />;
}
