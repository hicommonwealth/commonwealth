/* @jsx m */

import m from 'mithril';

import 'pages/discussions/summary_listing.scss';

import app from 'state';
import { Thread, Topic } from 'models';
import { formatTimestampAsDate, link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { getLastUpdated, isHot } from './helpers';

const getThreadCells = (sortedThreads: Thread[]) => {
  return sortedThreads.slice(0, 3).map((thread) => {
    const discussionLink = getProposalUrlPath(
      thread.slug,
      `${thread.identifier}-${slugify(thread.title)}`
    );

    return (
      <div class="thread-summary">
        {link('a.thread-title', discussionLink, thread.title)}
        <div class="last-updated">
          {formatTimestampAsDate(getLastUpdated(thread))}
          {isHot(thread) && <span>🔥</span>}
        </div>
      </div>
    );
  });
};

type SummaryRowAttrs = {
  isMobile: boolean;
  monthlyThreads: Thread[];
  topic: Topic;
};

class SummaryRow implements m.ClassComponent<SummaryRowAttrs> {
  view(vnode) {
    const { isMobile, monthlyThreads, topic } = vnode.attrs;

    if (!topic?.name) return null;

    const sortedThreads = monthlyThreads.sort((a, b) => {
      const aLastUpdated = a.lastCommentedOn || a.createdAt;
      const bLastUpdated = b.lastCommentedOn || b.createdAt;
      return bLastUpdated.valueOf() - aLastUpdated.valueOf();
    });

    return (
      <div class="SummaryRow">
        <div class="topic-cell">
          <h3
            onclick={(e) => {
              e.preventDefault();
              m.route.set(
                `/${app.activeChainId()}/discussions/${encodeURI(topic.name)}`
              );
            }}
          >
            {topic.name}
          </h3>
          <p>{topic.description}</p>
        </div>
        {isMobile && <h4 class="recent-thread-header">Recent threads</h4>}
        <div class="recent-thread-cell">{getThreadCells(sortedThreads)}</div>
      </div>
    );
  }
}

export default SummaryRow;
