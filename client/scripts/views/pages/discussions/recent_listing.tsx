/* @jsx m */

import m from 'mithril';

import 'pages/discussions/summary_listing.scss';

import app from 'state';
import { OffchainThread, OffchainTopic } from 'models';
import { Spinner } from 'construct-ui';
import { orderDiscussionsbyLastComment } from './helpers';
import { DiscussionFilterBar } from './discussion_filter_bar';
import LoadingRow from '../../components/loading_row';
import Sublayout from '../../sublayout';
import { pluralize } from 'helpers';

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

  oninit() {
    return null;
  }

  view() {
    if (this.initializing) {
      <div class="RecentListing">
        <DiscussionFilterBar
          topic={this.topic}
          stage={this.stage}
          parentState={this}
          disabled={true}
        />
        {m(LoadingRow)}
      </div>;
    }

    // TODO: More robust method of topic-determination
    this.topic = m.route.get().split('/')[2];
    this.stage = m.route.param('stage');

    // TODO: Handle pinned, lastVisited
    const allThreads = app.threads.listingStore
      .getByCommunityTopicAndStage(app.activeChainId(), this.topic, this.stage)
      .sort(orderDiscussionsbyLastComment);

    return (
      <Sublayout
        class="DiscussionsPage"
        title="Discussions"
        description={null} // TODO
        showNewProposalButton={true}
        // onscroll={this.onscroll}
      >
        <div class="RecentListing">
          <DiscussionFilterBar
            topic={this.topic}
            stage={this.stage}
            parentState={this}
          />
          <DiscussionScroll
            postsDepleted={this.postsDepleted}
            subpageName={this.topic || this.stage}
            totalThreadCount={this.allThreads.length}
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
