/* @jsx m */

import app from 'state';
import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { OffchainThread } from 'models';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { SummaryListing } from './summary_listing';
import { RecentListing } from './recent_listing';
import { DiscussionFilterBar } from './discussion_filter_bar';

class DiscussionsPage implements m.ClassComponent<null> {
  private returningFromThread: boolean;
  private summaryView: boolean;
  private topic?: string;
  private stage?: string;

  onscroll() {
    return null;
  }

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

  determineIfSummaryView() {
    // If URI specifies topic or stage, override
    if (this.topic || this.stage) {
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
  }

  oninit() {
    this.topic = m.route.param('topic');
    this.stage = m.route.param('stage');

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
    this.determineIfSummaryView();
  }

  view() {
    if (!app.chain || !app.chain.serverLoaded) {
      return m(PageLoading, {
        title: 'Discussions',
        showNewProposalButton: true,
      });
    }

    if (this.summaryView) {
      return <SummaryListing />;
    } else {
      localStorage.setItem('discussion-summary-toggle', 'false');
      return <RecentListing />;
    }

    // TODO: LastVisited logic
  }
}
