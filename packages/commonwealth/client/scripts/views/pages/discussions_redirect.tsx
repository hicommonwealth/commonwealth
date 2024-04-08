/* eslint-disable react/function-component-definition */
import React, { useEffect } from 'react';
import { NavigateOptions } from 'react-router-dom';

import { DefaultPage } from '@hicommonwealth/shared';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { useFlag } from '../../hooks/useFlag';
import { PageLoading } from './loading';

export default function DiscussionsRedirect() {
  const communityHomepageEnabled = useFlag('communityHomepage');
  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!app.chain) return;

    const { defaultPage, defaultOverview, hasHomepage } = app.chain.meta;
    let view;

    if (communityHomepageEnabled && hasHomepage) {
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
