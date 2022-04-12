/* @jsx m */

import app from 'state';
import _, { debounce } from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { PageLoading } from '../loading';
import { SummaryListing } from './summary_listing';
import { RecentListing } from './recent_listing';
import Sublayout from '../../sublayout';
import { DiscussionFilterBar } from './discussion_filter_bar';

class DiscussionsPage implements m.ClassComponent<{ topicName?: string }> {
  private returningFromThread: boolean;
  private summaryView: boolean;
  private summaryViewInitialized: boolean;
  private topicName: string;
  private stageName: string;

  recentListingScroll = async () => {
    const params = {
      topicName: this.topicName,
      stageName: this.stageName,
    };
    if (app.threads.listingStore.isDepleted(params)) return;

    // TODO Graham 4/11/22: This is a terrible class name and should be changed globally
    const scrollEle = document.getElementsByClassName('body')[0];
    const { scrollHeight, scrollTop } = scrollEle;

    // TODO: Handle redundant fetching
    if (scrollHeight - 1000 < scrollTop) {
      await app.threads.loadNextPage(params);
      m.redraw();
    }
  };

  // TODO: Only scoped to RecentListing
  handleScrollback() {
    const storedScrollYPos =
      localStorage[`${app.activeChainId()}-discussions-scrollY`];
    if (this.returningFromThread && storedScrollYPos) {
      setTimeout(() => {
        window.scrollTo(0, Number(storedScrollYPos));
      }, 100);
    }
  }

  initializeSummaryView() {
    // If URI specifies topic or stage, override
    if (this.topicName || this.stageName) {
      this.summaryView = false;
    }
    // If admin has set summary view as community default
    else if (app.chain.meta.chain.defaultSummaryView) {
      this.summaryView = true;
    }
    // If user is returning to a listing page previously toggled to summary
    else if (this.returningFromThread) {
      this.summaryView =
        localStorage.getItem('discussion-summary-toggle') === 'true';
    }

    this.summaryViewInitialized = true;
  }

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
    if (!this.summaryViewInitialized) {
      this.initializeSummaryView();
    }
    if (!this.summaryView) {
      localStorage.setItem('discussion-summary-toggle', 'false');
    }

    return (
      <Sublayout
        title="Discussions"
        description={null} // TODO
        showNewProposalButton={true}
        onscroll={
          !this.summaryView ? debounce(this.recentListingScroll, 400) : null
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

    // TODO: LastVisited logic
  }
}

export default DiscussionsPage;
