import React, { useEffect } from 'react';
import _ from 'underscore';

import app from 'state';
import { useNavigate } from 'react-router-dom';
import { PageLoading } from './loading';
import { DefaultPage } from '../../../../../common-common/src/types';

export default function DiscussionsRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!app.chain) return;

    const { defaultPage } = app.chain.meta;
    let view;

    // map old defaultOverview to new defaultPage
    if (_.isBoolean(defaultPage)) {
      view = defaultPage ? DefaultPage.Overview : DefaultPage.Discussions;
    } else {
      view = defaultPage;
    }

    switch (view) {
      case DefaultPage.Overview:
        navigate(`/${app.chain.id}/overview`);
        break;
      case DefaultPage.Discussions:
        navigate(`/${app.chain.id}/discussions`);
        break;
      case DefaultPage.Feed:
        navigate(`/${app.chain.id}/feed`);
        break;
      default:
        navigate(`/${app.chain.id}/discussions`);
    }
  });

  return <PageLoading />;
}
