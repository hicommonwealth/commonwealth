/* @jsx m */

import m from 'mithril';
import { debounce } from 'lodash';

import 'pages/discussions/index.scss';

import app from 'state';
import { PageLoading } from '../loading';
import { ThreadsOverview } from './threads_overview';
import { RecentListing } from './recent_listing';
import Sublayout from '../../sublayout';
import { DiscussionFilterBar } from './discussion_filter_bar';

// Graham 4/18/22 Todo: Consider re-implementing LastVisited logic
class DiscussionsPage implements m.ClassComponent<{ topicName?: string }> {
  private threadsOverview: boolean;
  private threadsOverviewInitialized: boolean;
  private topicName: string;
  private stageName: string;
  private fetchingThreads: boolean;

  get scrollEle() {
    return document.getElementsByClassName('Body')[0];
  }

  // Helpers

  getLastSeenDivider(hasText = true) {
    return (
      <div class="LastSeenDivider">
        {hasText ? (
          <>
            <hr />
            <span>Last visit</span>
            <hr />
          </>
        ) : (
          <hr />
        )}
      </div>
    );
  }

  getPageDescription() {
    if (!this.topicName) return;
    const topic = app.topics.getByName(this.topicName, app.activeChainId());
    return topic.description;
  }

  handleScrollback() {
    const storedScrollYPos =
      localStorage[`${app.activeChainId()}-discussions-scrollY`];
    if (app.lastNavigatedBack() && storedScrollYPos) {
      setTimeout(() => {
        this.scrollEle.scrollTo(0, Number(storedScrollYPos));
      }, 100);
    }
  }

  initializeSummaryView() {
    // Admin has set summary view as community default
    if (app.chain.meta.defaultOverview) {
      this.threadsOverview = true;
    }

    // User is returning to a summary-toggled listing page
    if (app.lastNavigatedBack()) {
      const summaryToggled = localStorage.getItem('discussion-summary-toggle');
      this.threadsOverview = summaryToggled === 'true';
    }

    this.threadsOverviewInitialized = true;
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
    this.handleScrollback();
  }

  view(vnode) {
    if (!app.chain || !app.chain.serverLoaded) {
      return m(PageLoading);
    }

    this.topicName = vnode.attrs.topic;
    this.stageName = m.route.param('stage');

    if (!this.threadsOverviewInitialized) this.initializeSummaryView();
    if (this.topicName || this.stageName) this.threadsOverview = false;
    if (!this.threadsOverview) {
      localStorage.setItem('discussion-summary-toggle', 'false');
    }

    return (
      <Sublayout
        title="Discussions"
        description={this.getPageDescription()}
        onscroll={
          !this.threadsOverview ? debounce(this.onscroll.bind(this), 400) : null
        }
      >
        <div class="DiscussionsPage">
          <DiscussionFilterBar
            topic={this.topicName}
            stage={this.stageName}
            parentState={this}
          />
          {this.threadsOverview ? (
            <ThreadsOverview />
          ) : (
            <RecentListing
              topicName={this.topicName}
              stageName={this.stageName}
            />
          )}
        </div>
      </Sublayout>
    );
  }
}

export default DiscussionsPage;
