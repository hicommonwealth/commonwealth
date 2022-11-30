/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/overview/index.scss';

import app from 'state';
import { Thread, Topic } from 'models';
import { navigateToSubpage } from 'app';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';
import { TopicSummaryRow } from './topic_summary_row';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWDivider } from '../../components/component_kit/cw_divider';
import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';

class OverviewPage extends ClassComponent {
  view() {
    const allMonthlyThreads = app.threads.overviewStore.getAll();

    const topics = app.topics.getByCommunity(app.activeChainId());

    const anyTopicsFeatured = topics.some((t) => t.featuredInSidebar);

    const topicsFiltered = anyTopicsFeatured
      ? topics.filter((t) => t.featuredInSidebar)
      : topics;

    const topicsSorted = anyTopicsFeatured
      ? topicsFiltered.sort((a, b) => a.order - b.order)
      : topicsFiltered.sort((a, b) => a.name.localeCompare(b.name)); // alphabetizes non-ordered + non-featured topics

    const topicSummaryRows: Array<{
      monthlyThreads: Array<Thread>;
      topic: Topic;
    }> = topicsSorted.map((topic) => {
      const monthlyThreads = allMonthlyThreads.filter(
        (thread) => topic.id === thread.topic.id
      );

      return { monthlyThreads, topic };
    });

    return !topicSummaryRows.length ? (
      <PageLoading />
    ) : (
      <Sublayout>
        <div class="OverviewPage">
          <div class="header-row">
            <div class="header-row-left">
              <CWText type="h3" fontWeight="semiBold">
                Overview
              </CWText>
              <CWButton
                className="latest-button"
                buttonType="mini"
                label="Latest Threads"
                iconName="home"
                onclick={() => {
                  navigateToSubpage('/discussions');
                }}
              />
            </div>
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
          {topicSummaryRows.map((row) => (
            <TopicSummaryRow {...row} />
          ))}
        </div>
      </Sublayout>
    );
  }
}

export default OverviewPage;
