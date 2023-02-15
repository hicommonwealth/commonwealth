import React from 'react';

import { ClassComponent, redraw } from 'mithrilInterop';
import type { Thread, Topic } from 'models';
import 'pages/overview/index.scss';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';
import { TopicSummaryRow } from './topic_summary_row';
import withRouter from 'navigation/helpers';

class OverviewPageComponent extends ClassComponent {
  private isWindowExtraSmall: boolean;

  onResize() {
    this.isWindowExtraSmall = isWindowExtraSmall(window.innerWidth);
    redraw();
  }

  oninit() {
    this.isWindowExtraSmall = isWindowExtraSmall(window.innerWidth);

    window.addEventListener('resize', () => {
      this.onResize();
    });
  }

  onremove() {
    window.removeEventListener('resize', () => {
      this.onResize();
    });
  }

  view() {
    const allMonthlyThreads = app.threads.overviewStore.getAll();
    const allPinnedThreads = app.threads.listingStore.getThreads({
      pinned: true,
    });

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
      pinnedThreads: Array<Thread>;
      topic: Topic;
    }> = topicsSorted.map((topic) => {
      const monthlyThreads = allMonthlyThreads.filter(
        (thread) => topic.id === thread.topic.id
      );
      const pinnedThreads = allPinnedThreads.filter(
        (thread) => topic.id === thread.topic.id
      );

      return { monthlyThreads, pinnedThreads, topic };
    });

    return !topicSummaryRows.length && !app.threads.initialized ? (
      <PageLoading />
    ) : (
      <Sublayout>
        <div className="OverviewPage">
          <div className="header-row">
            <div className="header-row-left">
              <CWText type="h3" fontWeight="semiBold">
                Overview
              </CWText>
              <CWButton
                className="latest-button"
                buttonType="mini-black"
                label="Latest Threads"
                iconLeft="home"
                onClick={() => {
                  this.setRoute('/discussions');
                }}
              />
            </div>
            {this.isWindowExtraSmall ? (
              <CWIconButton
                iconName="plusCircle"
                iconButtonTheme="black"
                onClick={() => {
                  this.setRoute('/new/discussion');
                }}
              />
            ) : (
              <CWButton
                buttonType="mini-black"
                label="Create Thread"
                iconLeft="plus"
                onClick={() => {
                  this.setRoute('/new/discussion');
                }}
              />
            )}
          </div>
          <div className="column-headers-row">
            <CWText
              type="h5"
              fontWeight="semiBold"
              className="threads-header-row-text"
            >
              Topic
            </CWText>
            <div className="threads-header-container">
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
          {topicSummaryRows.map((row, i) => (
            <TopicSummaryRow {...row} key={i} />
          ))}
        </div>
      </Sublayout>
    );
  }
}

const OverviewPage = withRouter(OverviewPageComponent);

export default OverviewPage;
