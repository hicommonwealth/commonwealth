import React, { useEffect } from 'react';

import app from 'state';
import { useNavigate } from 'react-router-dom';
import { PageLoading } from './loading';
import { DefaultPage } from '../../../../../common-common/src/types';

export default function DiscussionsRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!app.chain) return;

    const { defaultPage, defaultOverview, hasHomepage } = app.chain.meta;
    let view;

    if (hasHomepage) {
      view = defaultPage;
    } else {
      view = defaultOverview ? DefaultPage.Overview : DefaultPage.Discussions;
    }

    switch (view) {
      case DefaultPage.Overview:
        navigate(`/${app.chain.id}/overview`);
        break;
      case DefaultPage.Discussions:
        navigate(`/${app.chain.id}/discussions`);
        break;
      case DefaultPage.Homepage:
        navigate(`/${app.chain.id}/feed`);
        break;
      default:
        navigate(`/${app.chain.id}/discussions`);
    }
  });

  return <PageLoading />;
}
