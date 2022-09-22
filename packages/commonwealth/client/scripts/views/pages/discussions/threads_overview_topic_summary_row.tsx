/* @jsx m */

import m from 'mithril';

import 'pages/discussions/threads_overview_topic_summary_row.scss';

import app from 'state';
import { Thread, Topic } from 'models';
// import { formatTimestampAsDate, link } from 'helpers';
// import { getProposalUrlPath } from 'identifiers';
// import { slugify } from 'utils';
// import { getLastUpdated, isHot } from './helpers';
import { CWText } from '../../components/component_kit/cw_text';

type SummaryRowAttrs = {
  monthlyThreads: Array<Thread>;
  topic: Topic;
};

export class ThreadsOverviewTopicSummaryRow
  implements m.ClassComponent<SummaryRowAttrs>
{
  view(vnode) {
    const { monthlyThreads, topic } = vnode.attrs;

    const sortedThreads = monthlyThreads.sort((a, b) => {
      const aLastUpdated = a.lastCommentedOn || a.createdAt;
      const bLastUpdated = b.lastCommentedOn || b.createdAt;
      return bLastUpdated.valueOf() - aLastUpdated.valueOf();
    });

    return (
      <div class="ThreadsOverviewTopicSummaryRow">
        <div class="topic-column">
          <CWText
            type="h4"
            fontWeight="semiBold"
            className="topic-name-text"
            onclick={(e) => {
              e.preventDefault();
              m.route.set(
                `/${app.activeChainId()}/discussions/${encodeURI(topic.name)}`
              );
            }}
          >
            {topic.name}
          </CWText>
          <CWText
            type="caption"
            fontWeight="medium"
            className="threads-count-text"
          >
            {monthlyThreads.length} Threads
          </CWText>
          <CWText type="b2">{topic.description}</CWText>
        </div>
        <div class="recent-threads-column">
          {sortedThreads.slice(0, 5).map((thread) => {
            console.log(thread);

            // const discussionLink = getProposalUrlPath(
            //   thread.slug,
            //   `${thread.identifier}-${slugify(thread.title)}`
            // );

            return (
              <CWText type="b2" fontWeight="bold">
                {thread.title}
                {/* <div class="last-updated">
          {formatTimestampAsDate(getLastUpdated(thread))}
          {isHot(thread) && <span>🔥</span>}
        </div> */}
              </CWText>
            );
          })}
        </div>
      </div>
    );
  }
}
