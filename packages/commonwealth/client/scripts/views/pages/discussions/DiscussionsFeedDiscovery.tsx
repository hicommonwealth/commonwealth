/* eslint-disable max-len */
import { ThreadFeaturedFilterTypes } from 'models/types';
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface DiscussionsFeedDiscoveryProps {
  readonly orderBy: ThreadFeaturedFilterTypes;
  readonly community: string;
  readonly includePinnedThreads: boolean;
}

export const DiscussionsFeedDiscovery = (
  props: DiscussionsFeedDiscoveryProps,
) => {
  const { orderBy, community, includePinnedThreads } = props;

  return (
    <Helmet>
      <link
        rel="alternate"
        type="application/atom+xml"
        title="ATOM"
        href={`/api/feed?cursor=1&limit=20&community_id=${community}&includePinnedThreads=${includePinnedThreads}&order_by=${orderBy}`}
      />
    </Helmet>
  );
};
