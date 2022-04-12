/* @jsx m */

import 'pages/discussions/summary_listing.scss';

import m from 'mithril';
import app from 'state';
import { OffchainTopic } from 'client/scripts/models';
import LoadingRow from '../../components/loading_row';
import SummaryRow from './summary_row';

export class SummaryListing implements m.ClassComponent {
  private initializing: boolean;
  private isMobile: boolean;

  oninit() {
    this.initializing = true;
    app.recentActivity.getRecentTopicActivity().then(() => {
      this.initializing = false;
      m.redraw();
    });
  }

  view() {
    if (this.initializing) {
      return m(LoadingRow);
    }

    const recentThreads = app.threads.summaryStore.getAll();
    const sortedTopics = app.topics
      .getByCommunity(app.activeChainId())
      .sort((a: OffchainTopic, b: OffchainTopic) => {
        return a.name.localeCompare(b.name);
      });

    const isMobile = window.innerWidth < 767.98;

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
            const topicScopedThreads = recentThreads.filter(
              (thread) => thread.topic?.id === topic?.id
            );
            return (
              <SummaryRow
                isMobile={isMobile}
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
