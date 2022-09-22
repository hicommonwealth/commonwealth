/* @jsx m */

import m from 'mithril';

import 'pages/discussions/thread_summary_row.scss';

import app from 'state';
import { Thread, Topic } from 'models';
// import { formatTimestampAsDate, link } from 'helpers';
// import { getProposalUrlPath } from 'identifiers';
// import { slugify } from 'utils';
// import { getLastUpdated, isHot } from './helpers';
import { CWText } from '../../components/component_kit/cw_text';

const getThreadCells = (sortedThreads: Thread[]) =>
  sortedThreads.slice(0, 5).map((thread) => {
    // const discussionLink = getProposalUrlPath(
    //   thread.slug,
    //   `${thread.identifier}-${slugify(thread.title)}`
    // );

    return (
      <CWText>
        {thread.title}
        {/* <div class="last-updated">
          {formatTimestampAsDate(getLastUpdated(thread))}
          {isHot(thread) && <span>🔥</span>}
        </div> */}
      </CWText>
    );
  });

type SummaryRowAttrs = {
  monthlyThreads: Array<Thread>;
  topic: Topic;
};

export class ThreadSummaryRow implements m.ClassComponent<SummaryRowAttrs> {
  view(vnode) {
    const { monthlyThreads, topic } = vnode.attrs;

    const sortedThreads = monthlyThreads.sort((a, b) => {
      const aLastUpdated = a.lastCommentedOn || a.createdAt;
      const bLastUpdated = b.lastCommentedOn || b.createdAt;
      return bLastUpdated.valueOf() - aLastUpdated.valueOf();
    });

    return (
      <div class="ThreadSummaryRow">
        <div class="topic-column">
          <CWText
            type="h4"
            fontWeight="semiBold"
            onclick={(e) => {
              e.preventDefault();
              m.route.set(
                `/${app.activeChainId()}/discussions/${encodeURI(topic.name)}`
              );
            }}
          >
            {topic.name}
          </CWText>
          <CWText type="caption" fontWeight="medium">
            [count] Threads
          </CWText>
          <CWText type="b2">{topic.description}</CWText>
        </div>
        <div class="recent-threads-column">{getThreadCells(sortedThreads)}</div>
      </div>
    );
  }
}
