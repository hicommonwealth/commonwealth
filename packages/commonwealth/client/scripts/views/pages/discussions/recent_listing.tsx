/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/discussions/recent_listing.scss';

import app from 'state';
import { pluralize } from 'helpers';
import { LoadingRow } from '../../components/loading_row';
import { DiscussionRow } from './discussion_row';
import { EmptyListingPlaceholder } from '../../components/empty_topic_placeholder';
import { CWText } from '../../components/component_kit/cw_text';
import { CWSpinner } from '../../components/component_kit/cw_spinner';

type RecentListingAttrs = {
  stageName: string;
  topicName: string;
};
export class RecentListing extends ClassComponent<RecentListingAttrs> {
  private initializing: boolean;

  view(vnode: m.Vnode<RecentListingAttrs>) {
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
      return LoadingRow;
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
      return <EmptyListingPlaceholder stageName={topicName} />;
    }

    const subpage = topicName || stageName;

    return (
      <div class="RecentListing">
        {pinnedThreads.map((t) => (
          <DiscussionRow proposal={t} />
        ))}
        {unpinnedThreads.map((t) => (
          <DiscussionRow proposal={t} />
        ))}
        <div class="listing-scroll">
          {listingDepleted ? (
            <CWText className="thread-count-text">
              {`Showing ${totalThreadCount} of ${pluralize(
                totalThreadCount,
                'thread'
              )}${subpage ? ` under the subpage '${subpage}'` : ''}`}
            </CWText>
          ) : (
            <CWSpinner size="large" />
          )}
        </div>
      </div>
    );
  }
}
