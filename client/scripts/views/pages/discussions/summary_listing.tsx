/* @jsx m */

import m from 'mithril';

import 'pages/discussions/summary_listing.scss';

import app from 'state';
import { OffchainThread } from 'models';
import LoadingRow from '../../components/loading_row';
import SummaryRow from './summary_row';
export class SummaryListing implements m.ClassComponent {
  private activityFetched: boolean;
  private initializing: boolean;
  private recentThreads: OffchainThread[];
  private isMobile: boolean;

  oninit() {
    this.isMobile = window.innerWidth < 767.98;
    // TODO Graham 4/5/22: Investigate recentActivity controller
    this.initializing = true;
    app.recentActivity
      .getRecentTopicActivity({
        chainId: app.activeChainId(),
      })
      .then((res) => {
        this.initializing = false;
        this.recentThreads = res;
      });
  }

  view() {
    if (!this.activityFetched) {
      this.initializing = true;
      app.recentActivity
        .getRecentTopicActivity({
          chainId: app.activeChainId(),
        })
        .then((res) => {
          this.activityFetched = true;
          this.initializing = false;
          this.recentThreads = res;
          m.redraw();
        });
    }
    if (this.initializing) {
      return m(LoadingRow);
    }

    // TODO
    // this.recentThreads = app.recentActivity.getAll();

    const sortedTopics = app.topics
      .getByCommunity(app.activeChainId())
      .sort((a, b) => {
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
          return -1;
        }
        if (a.name.toLowerCase() > b.name.toLowerCase()) {
          return 1;
        }
        return 0;
      });

    return (
      <div class="SummaryListing">
        {!this.isMobile && (
          <div class="row-header">
            <h4 class="topic-header">Topic</h4>
            <h4 class="recent-thread-header">Recent threads</h4>
          </div>
        )}
        <div class="row-wrap">
          {sortedTopics.map((topic) => {
            const topicScopedThreads = this.recentThreads.filter(
              (thread) => thread.topic?.id === topic?.id
            );
            return (
              <SummaryRow
                isMobile={this.isMobile}
                monthlyThreads={topicScopedThreads}
                topic={topic}
              />
            );
          })}
        </div>
      </div>
    );
  }
}
