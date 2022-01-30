/* eslint-disable @typescript-eslint/ban-types */
import 'pages/discussions/summary_listing.scss';
import app from 'state';
import m from 'mithril';
import { OffchainThread, OffchainTopic } from 'models';
import { formatLastUpdated, link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { getLastUpdated, isHot } from './discussion_row';

const getThreadCells = (sortedThreads: OffchainThread[]) => {
  return sortedThreads.slice(0, 3).map((thread) => {
    const discussionLink = getProposalUrlPath(thread.slug, `${thread.identifier}-${slugify(thread.title)}`);
    return m('.thread-summary', [
      link('a.thread-title', discussionLink, thread.title),
      m('.last-updated', [
        m('span', formatLastUpdated(getLastUpdated(thread))),
        isHot(thread) && m('span', '🔥'),
      ])
    ]);
  })
}

const SummaryRow: m.Component<
  {
    topic: OffchainTopic;
    monthlyThreads: OffchainThread[];
    isMobile: boolean;
  },
  {}
> = {
  view: (vnode) => {
    const { topic, monthlyThreads, isMobile } = vnode.attrs;
    if (!topic?.name) return null;
    const sortedThreads = monthlyThreads.sort((a, b) => {
      const aLastUpdated = a.lastCommentedOn || a.createdAt;
      const bLastUpdated = b.lastCommentedOn || b.createdAt;
      return bLastUpdated.valueOf() - aLastUpdated.valueOf();
    });
    return m('.SummaryRow',
      isMobile
      ? [
        m('h4.topic-header', 'Topic'),
        m('.topic-cell', [
          m('h3', {
            onclick: (e) => {
              e.preventDefault();
              m.route.set(`/${app.activeChainId()}/discussions/${encodeURI(topic.name)}`);
            },
          }, topic.name),
          m('p', topic.description)
        ]),
        m('h4.recent-thread-header', 'Recent threads'),
        m('.recent-thread-cell', getThreadCells(sortedThreads)),
      ]
      : [
        m('.topic-cell', [
          m('h3', {
            onclick: (e) => {
              e.preventDefault();
              m.route.set(`/${app.activeChainId()}/discussions/${encodeURI(topic.name)}`);
            },
          }, topic.name),
          m('p', topic.description)
        ]),
        m('.recent-thread-cell', getThreadCells(sortedThreads)),
      ]
    );
  },
};

export const SummaryListing: m.Component<
  { recentThreads: OffchainThread[] },
  {}
> = {
  view: (vnode) => {
    const topicScopedThreads = {};
    const topics = app.topics.getByCommunity(app.activeChainId());
    topics.forEach((topic) => {
      topicScopedThreads[topic.id] = vnode.attrs.recentThreads.filter(
        (thread) => thread.topic?.id === topic?.id
      );
    });
    const sortedTopics = topics.sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) { return -1; }
      if (a.name.toLowerCase() > b.name.toLowerCase()) { return 1; }
      return 0;
    });
    const isMobile = window.innerWidth < 767.98;

    return m('.SummaryListing', [
      !isMobile
      && m('.row-header', [
        m('h4.topic-header', 'Topic'),
        m('h4.recent-thread-header', 'Recent threads'),
      ]),
      m('.row-wrap',
        sortedTopics.map((topic: OffchainTopic) => {
          return m(SummaryRow, {
            topic,
            monthlyThreads: topicScopedThreads[topic.id],
            isMobile
          });
        })
      ),
    ]);
  },
};
