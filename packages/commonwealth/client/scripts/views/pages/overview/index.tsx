/* @jsx m */

import m from 'mithril';

import 'pages/overview/index.scss';

import app from 'state';
import { LoadingRow } from '../../components/loading_row';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';
import { TopicSummaryRow } from './topic_summary_row';

class OverviewPage implements m.ClassComponent {
  private initializing: boolean;

  oninit() {
    app.recentActivity.getRecentTopicActivity().then(() => {
      m.redraw();
    });
  }

  view() {
    if (this.initializing) {
      return LoadingRow;
    }

    const topics = app.topics.getByCommunity(app.activeChainId());

    return (
      <div class="Overview">
        <div class="header-row">
          <CWText
            type="h5"
            fontWeight="semiBold"
            className="threads-header-row-text"
          >
            Topic
          </CWText>
          <div class="threads-header-container">
            <CWText
              type="h5"
              fontWeight="semiBold"
              className="threads-header-row-text"
            >
              Recent threads
            </CWText>
            {/* <CWButton buttonType="mini" label="Create Thread" iconName="plus" /> */}
          </div>
        </div>
        {topics
          .sort((a, b) => a.order - b.order)
          .filter((t) => t.featuredInSidebar)
          .map((topic) => {
            const monthlyThreads = app.threads.overviewStore
              .getAll()
              .filter((thread) => thread.topic.id === topic.id);

            return (
              <TopicSummaryRow monthlyThreads={monthlyThreads} topic={topic} />
            );
          })}
      </div>
    );
  }
}

export default OverviewPage;
