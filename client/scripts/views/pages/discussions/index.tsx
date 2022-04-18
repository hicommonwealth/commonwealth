/* @jsx m */

import 'pages/discussions/index.scss';

import app from 'state';
import { debounce } from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { PageLoading } from '../loading';
import { SummaryListing } from './summary_listing';
import { RecentListing } from './recent_listing';
import Sublayout from '../../sublayout';
import { DiscussionFilterBar } from './discussion_filter_bar';

// Graham 4/18/22 Todo:
// * LastVisited logic
// * Investigate possible redundant fetches originating in onscroll

class DiscussionsPage implements m.ClassComponent<{ topicName?: string }> {
  private returningFromThread: boolean;
  private summaryView: boolean;
  private summaryViewInitialized: boolean;
  private topicName: string;
  private stageName: string;

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
    console.log({ storedScrollYPos });
    if (this.returningFromThread && storedScrollYPos) {
      setTimeout(() => {
        window.scrollTo(0, Number(storedScrollYPos));
      }, 100);
    }
  }

  initializeSummaryView() {
    // Admin has set summary view as community default
    if (app.chain.meta.chain.defaultSummaryView) {
      this.summaryView = true;
    }
    // User is returning to a summary-toggled listing page
    if (this.returningFromThread) {
      this.summaryView =
        localStorage.getItem('discussion-summary-toggle') === 'true';
    }
    this.summaryViewInitialized = true;
  }

  async onscroll() {
    const { topicName, stageName } = this;
    const { listingStore } = app.threads;
    if (listingStore.isDepleted({ topicName, stageName })) {
      return;
    }

    const scrollEle = document.getElementsByClassName('Body')[0];
    const { scrollHeight, scrollTop } = scrollEle;

    if (scrollHeight - 1000 < scrollTop) {
      console.log(' fetching ');
      console.log(
        app.threads.listingStore.getThreads({ topicName, stageName })
      );
      await app.threads.loadNextPage({ topicName, stageName });
      m.redraw();
    }
  }

  // Lifecycle methods

  oninit() {
    this.returningFromThread =
      app.lastNavigatedBack() &&
      app.lastNavigatedFrom().includes('/discussion/');
  }

  oncreate() {
    mixpanel.track('PageVisit', {
      'Page Name': 'DiscussionsPage',
      Scope: app.activeChainId(),
    });

    this.handleScrollback();
  }

  view(vnode) {
    if (!app.chain || !app.chain.serverLoaded) {
      return m(PageLoading, {
        title: 'Discussions',
        showNewProposalButton: true,
      });
    }

    this.topicName = vnode.attrs.topic;
    this.stageName = m.route.param('stage');

    if (!this.summaryViewInitialized) this.initializeSummaryView();
    // If URI specifies topic or stage, override default/historical settings
    if (this.topicName || this.stageName) this.summaryView = false;
    if (!this.summaryView) {
      localStorage.setItem('discussion-summary-toggle', 'false');
    }

    return (
      <Sublayout
        title="Discussions"
        description={this.getPageDescription()}
        showNewProposalButton={true}
        onscroll={
          !this.summaryView ? debounce(this.onscroll.bind(this), 400) : null
        }
      >
        <div class="DiscussionsPage">
          <DiscussionFilterBar
            topic={this.topicName}
            stage={this.stageName}
            parentState={this}
          />
          {this.summaryView && <SummaryListing />}
          {!this.summaryView && (
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
