/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'pages/discussions/summary_listing.scss';

import app from 'state';
import { OffchainThread, OffchainTopic } from 'models';
import { Spinner } from 'construct-ui';
import { pluralize } from 'helpers';
import { debounce } from 'lodash';
import { DiscussionFilterBar } from './discussion_filter_bar';
import LoadingRow from '../../components/loading_row';
import Sublayout from '../../sublayout';
import { DiscussionRow } from './discussion_row';

interface DiscussionScrollAttrs {
  postsDepleted: boolean;
  subpageName: string;
  totalThreadCount: number;
}
export class DiscussionScroll
  implements m.ClassComponent<DiscussionScrollAttrs>
{
  view(vnode) {
    const { postsDepleted, subpageName, totalThreadCount } = vnode.attrs;
    if (postsDepleted) {
      let postsDepletedCopy = `Showing ${totalThreadCount} of ${pluralize(
        totalThreadCount,
        'thread'
      )}`;
      if (subpageName)
        postsDepletedCopy += ` under the subpage '${subpageName}'`;
      return <div class="infinite-scroll-reached-end">{postsDepletedCopy}</div>;
    } else if (totalThreadCount !== 0) {
      return (
        <div class="infinite-scroll-spinner-wrap">
          <Spinner active={true} size="lg" />
        </div>
      );
    }
  }
}

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
  private allThreads: OffchainThread[];
  private postsDepleted: boolean;
  // TODO: Better variable name
  private isEmpty: boolean;
  // TODO: Try to get a proper OffchainTopic/Stage object
  private topic: string;
  private stage: string;

  view(vnode) {
    const { topicName, stageName } = vnode.attrs;
    const pageParams = { topicName, stageName };

    const listingInitialized =
      app.threads.listingStore.isInitialized(pageParams);
    const listingDepleted = app.threads.listingStore.isDepleted(pageParams);

    if (!listingInitialized) {
      this.initializing = true;
      app.threads
        .loadNextPage({
          topicName,
          stageName,
        })
        .then(() => {
          this.initializing = false;
          m.redraw();
        });
    }
    if (this.initializing) {
      console.log('initializing');
      return m(LoadingRow);
    }

    // TODO: Handle lastVisited
    const pinnedThreads = app.threads.listingStore.getListingThreads({
      ...pageParams,
      pinned: true,
    });
    const unpinnedThreads = app.threads.listingStore.getListingThreads({
      ...pageParams,
      pinned: false,
    });

    console.log({ pinnedThreads, unpinnedThreads });

    console.log({ pinnedThreads, unpinnedThreads });

    return (
      <div class="RecentListing">
        <DiscussionListing threads={pinnedThreads} />
        <DiscussionListing threads={unpinnedThreads} />
        <DiscussionScroll
          postsDepleted={listingDepleted}
          subpageName={topicName || stageName}
          totalThreadCount={pinnedThreads.length + unpinnedThreads.length}
        />
      </div>
    );
  }
}

// const content = isEmpty
//   ? m(EmptyListingPlaceholder, {
//       stageName: stage,
//       communityName,
//       topicName,
//     })
// : m(Listing, { content: sortedListing })}
