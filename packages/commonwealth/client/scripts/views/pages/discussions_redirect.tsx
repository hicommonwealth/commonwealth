import React, { useEffect } from 'react';
import _ from 'underscore';

import app from 'state';
import { useNavigate } from 'react-router-dom';
import { PageLoading } from './loading';
import { DefaultView } from '../../../../../common-common/src/types';

export default function DiscussionsRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!app.chain) return;

    const { defaultView } = app.chain.meta;
    let view;

    // map old defaultOverview to new defaultView
    if (_.isBoolean(defaultView)) {
      view = defaultView ? DefaultView.Overview : DefaultView.Discussions;
    } else {
      view = defaultView;
    }

    switch (view) {
      case DefaultView.Overview:
        navigate(`/${app.chain.id}/overview`);
        break;
      case DefaultView.Discussions:
        navigate(`/${app.chain.id}/discussions`);
        break;
      case DefaultView.Feed:
        navigate(`/${app.chain.id}/feed`);
        break;
      default:
        navigate(`/${app.chain.id}/discussions`);
    }
  });

  return <PageLoading />;
}
