import React, { useEffect } from 'react';

import app from 'state';
import { PageLoading } from './loading';
import { DefaultPage } from '../../../../../common-common/src/types';
import { useCommonNavigate } from 'navigation/helpers';

export default function DiscussionsRedirect() {
  const navigate = useCommonNavigate();
  console.log('app', app);

  useEffect(() => {
    console.log('app.chain', app.chain);

    if (!app.chain) return;

    const { defaultPage, defaultOverview, hasHomepage } = app.chain.meta;
    let view;

    console.log('app.chain.meta', app.chain.meta);

    if (hasHomepage) {
      view = defaultPage;
    } else {
      view = defaultOverview ? DefaultPage.Overview : DefaultPage.Discussions;
    }

    console.log('view', view);

    // @TODO: make sure that this navigation does not apply to back button
    switch (view) {
      case DefaultPage.Overview:
        navigate('/overview');
        break;
      case DefaultPage.Discussions:
        navigate('/discussions');
        break;
      case DefaultPage.Homepage:
        navigate('/feed');
        break;
      default:
        navigate('/discussions');
    }
  });

  return <PageLoading />;
}
