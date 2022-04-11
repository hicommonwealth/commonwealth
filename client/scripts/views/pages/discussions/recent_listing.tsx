/* @jsx m */

import m from 'mithril';

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

interface RecentListingAttrs {}
export class RecentListing implements m.ClassComponent<RecentListingAttrs> {
  private initializing: boolean;
  private allThreads: OffchainThread[];
  private postsDepleted: boolean;
  // TODO: Better variable name
  private isEmpty: boolean;
  // TODO: Try to get a proper OffchainTopic/Stage object
  private topic: string;
  private stage: string;

  onScroll() {
    const options = {
      topicName: this.topic,
      stageName: this.stage,
    };

    return debounce(async () => {
      const params = {
        topicName: this.topic,
        stageName: this.stage,
      };
      if (app.threads.listingStore.isDepleted(params)) return;
      const scrollHeight = $(document).height();
      const scrollPos = $(window).height() + $(window).scrollTop();
      if (scrollPos > scrollHeight - 400) {
        await app.threads.loadNextPage(options);
        m.redraw();
      }
    }, 400);
  }

  oninit() {
    // TODO: More robust method of topic-determination
    this.topic = m.route.get().split('/')[2];
    this.stage = m.route.param('stage');
  }

  view() {
    const subpageParams = {
      topicName: this.topic,
      stageName: this.stage,
    };

    if (!app.threads.listingStore.isInitialized(subpageParams)) {
      this.initializing = true;
      app.threads
        .loadNextPage({
          topicName: this.topic,
          stageName: this.stage,
        })
        .then(() => {
          this.initializing = false;
        });
    }
    if (this.initializing) {
      return (
        <div class="RecentListing">
          <DiscussionFilterBar
            topic={this.topic}
            stage={this.stage}
            parentState={this}
            disabled={true}
          />
          {m(LoadingRow)}
        </div>
      );
    }

    // TODO: Handle lastVisited
    const pinnedThreads = app.threads.listingStore.getListingThreads({
      ...subpageParams,
      pinned: true,
    });
    const unpinnedThreads = app.threads.listingStore.getListingThreads({
      ...subpageParams,
      pinned: false,
    });

    return (
      <Sublayout
        class="DiscussionsPage"
        title="Discussions"
        description={null} // TODO
        showNewProposalButton={true}
        onscroll={this.onScroll}
      >
        <div class="RecentListing">
          <DiscussionFilterBar
            topic={this.topic}
            stage={this.stage}
            parentState={this}
          />
          <DiscussionListing threads={pinnedThreads} />
          <DiscussionListing threads={unpinnedThreads} />
          <DiscussionScroll
            postsDepleted={app.threads.listingStore.isDepleted(subpageParams)}
            subpageName={this.topic || this.stage}
            totalThreadCount={pinnedThreads.length + unpinnedThreads.length}
          />
        </div>
      </Sublayout>
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
