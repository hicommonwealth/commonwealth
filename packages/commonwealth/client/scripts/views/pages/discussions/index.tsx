/* @jsx m */

import m from 'mithril';
import { debounce } from 'lodash';

import 'pages/discussions/index.scss';

import app from 'state';
import { PageLoading } from '../loading';
import { RecentListing } from './recent_listing';
import Sublayout from '../../sublayout';
import { DiscussionFilterBar } from './discussion_filter_bar';

type DiscussionPageAttrs = { topic?: string };

// Graham 4/18/22 Todo: Consider re-implementing LastVisited logic
class DiscussionsPage implements m.ClassComponent<DiscussionPageAttrs> {
  private topicName: string;
  private stageName: string;
  private fetchingThreads: boolean;

  get scrollEle() {
    return document.getElementsByClassName('Body')[0];
  }

  async onscroll() {
    localStorage[`${app.activeChainId()}-discussions-scrollY`] =
      this.scrollEle.scrollTop;

    const { fetchingThreads, topicName, stageName } = this;

    if (fetchingThreads) return;

    const params = { topicName, stageName };

    const noThreadsRemaining = app.threads.listingStore.isDepleted(params);

    if (noThreadsRemaining) return;

    const { scrollHeight, scrollTop } = this.scrollEle;

    const fetchpointNotReached = scrollHeight - 1000 >= scrollTop;

    if (fetchpointNotReached) return;

    this.fetchingThreads = true;

    await app.threads.loadNextPage({ topicName, stageName });

    this.fetchingThreads = false;

    m.redraw();
  }

  // Lifecycle methods

  oncreate() {
    const storedScrollYPos =
      localStorage[`${app.activeChainId()}-discussions-scrollY`];

    if (app.lastNavigatedBack() && storedScrollYPos) {
      setTimeout(() => {
        this.scrollEle.scrollTo(0, Number(storedScrollYPos));
      }, 100);
    }
  }

  view(vnode: m.VnodeDOM<DiscussionPageAttrs, this>) {
    if (!app.chain || !app.chain.serverLoaded) {
      return <PageLoading />;
    }

    this.topicName = vnode.attrs.topic;
    this.stageName = m.route.param('stage');

    return (
      <Sublayout
        title="Discussions"
        description={
          app.topics.getByName(this.topicName, app.activeChainId()) || ''
        }
        onscroll={debounce(this.onscroll.bind(this), 400)}
      >
        <div class="DiscussionsPage">
          <DiscussionFilterBar
            topic={this.topicName}
            stage={this.stageName}
            parentState={this}
          />
          <RecentListing
            topicName={this.topicName}
            stageName={this.stageName}
          />
        </div>
      </Sublayout>
    );
  }
}

export default DiscussionsPage;
