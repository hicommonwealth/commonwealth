/* @jsx m */

import m from 'mithril';

import 'pages/overview/index.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { LoadingRow } from '../../components/loading_row';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';
import { TopicSummaryRow } from './topic_summary_row';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWDivider } from '../../components/component_kit/cw_divider';
import Sublayout from '../../sublayout';

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

    const sortedTopics = app.topics
      .getByCommunity(app.activeChainId())
      .sort((a, b) => a.order - b.order);

    const topicsToDisplay = sortedTopics.some((t) => t.featuredInSidebar)
      ? sortedTopics.filter((t) => t.featuredInSidebar)
      : sortedTopics;

    return (
      <Sublayout>
        <div class="OverviewPage">
          <div class="header-row">
            <CWText type="h3" fontWeight="semiBold">
              Overview
            </CWText>
            {isWindowExtraSmall(window.innerWidth) ? (
              <CWIconButton
                iconName="plusCircle"
                iconButtonTheme="black"
                onclick={() => {
                  navigateToSubpage('/new/discussion');
                }}
              />
            ) : (
              <CWButton
                buttonType="mini"
                label="Create Thread"
                iconName="plus"
                onclick={() => {
                  navigateToSubpage('/new/discussion');
                }}
              />
            )}
          </div>
          <div class="column-headers-row">
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
            </div>
          </div>
          <CWDivider />
          {topicsToDisplay.map((topic) => {
            const monthlyThreads = app.threads.overviewStore
              .getAll()
              .filter((thread) => thread.topic.id === topic.id);

            return (
              <TopicSummaryRow monthlyThreads={monthlyThreads} topic={topic} />
            );
          })}
        </div>
      </Sublayout>
    );
  }
}

export default OverviewPage;
