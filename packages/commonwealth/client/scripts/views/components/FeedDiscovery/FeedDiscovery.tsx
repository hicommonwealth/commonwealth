/* eslint-disable max-len */
import React from 'react';
import { Helmet } from 'react-helmet';

export const FeedDiscovery = () => {
  if (document.location.pathname.endsWith('/discussions')) {
    const community = document.location.pathname.split('/')[0];
    const url = new URL(document.location.href);

    const orderBy = url.searchParams.get('orderBy') ?? 'createdAt:desc';
    const includePinnedThreads =
      url.searchParams.get('includePinnedThreads') ?? 'true';
    return (
      <Helmet>
        <link
          rel="alternate"
          type="application/atom+xml"
          title="ATOM"
          href={`/api/feed?bulk=true&page=1&limit=20&community_id=${community}&includePinnedThreads=${includePinnedThreads}&orderBy=${orderBy}`}
        />
      </Helmet>
    );
  }

  return null;
};
