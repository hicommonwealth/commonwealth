/* @jsx m */

import 'pages/discussions/recent_listing.scss';

import m from 'mithril';

import app from 'state';
import { OffchainThread } from 'models';
import LoadingRow from '../../components/loading_row';
import { DiscussionRow } from './discussion_row';
import EmptyListingPlaceholder from '../../components/empty_topic_placeholder';
import { ListingScroll } from './listing_scroll';

export class DiscussionListing
  implements m.ClassComponent<{ threads: OffchainThread[] }>
{
  view(vnode) {
    return vnode.attrs.threads.map((t) => {
      return m(DiscussionRow, { proposal: t });
    });
  }
}

interface RecentListingAttrs {
  topicName: string;
  stageName: string;
}
export class RecentListing implements m.ClassComponent<RecentListingAttrs> {
  private initializing: boolean;

  view(vnode) {
    const { topicName, stageName } = vnode.attrs;
    const { listingStore } = app.threads;
    const listingInitialized = listingStore.isInitialized({
      topicName,
      stageName,
    });
    const listingDepleted = listingStore.isDepleted({ topicName, stageName });
    // Fetch first 20 unpinned threads
    if (!listingInitialized) {
      this.initializing = true;
      app.threads.loadNextPage({ topicName, stageName }).then(() => {
        this.initializing = false;
        m.redraw();
      });
    }
    if (this.initializing) {
      return m(LoadingRow);
    }

    const pinnedThreads = listingStore.getThreads({
      topicName,
      stageName,
      pinned: true,
    });
    const unpinnedThreads = listingStore.getThreads({
      topicName,
      stageName,
      pinned: false,
    });

    const totalThreadCount = pinnedThreads.length + unpinnedThreads.length;
    if (!totalThreadCount) {
      return m(EmptyListingPlaceholder, { stageName, topicName });
    }

    // Graham 4/12/22: If desired, reinstate + rewrite lastSeenMarker
    return (
      <div class="RecentListing">
        <DiscussionListing threads={pinnedThreads} />
        <DiscussionListing threads={unpinnedThreads} />
        <ListingScroll
          listingDepleted={listingDepleted}
          subpageName={topicName || stageName}
          totalThreadCount={totalThreadCount}
        />
      </div>
    );
  }
}
