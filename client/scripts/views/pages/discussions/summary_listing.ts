/* eslint-disable @typescript-eslint/ban-types */
import 'pages/discussions/summary_listing.scss';
import app from 'state';
import m from 'mithril';
import { OffchainThread, OffchainTopic } from 'models';
import { formatLastUpdated, link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { getLastUpdated, isHot } from './discussion_row';

const SummaryRow: m.Component<
  {
    topic: OffchainTopic;
    monthlyThreads: OffchainThread[];
  },
  {}
> = {
  view: (vnode) => {
    const { topic, monthlyThreads } = vnode.attrs;
    if (!topic?.name) return null;
    const sortedThreads = monthlyThreads.sort((a, b) => {
      const aLastUpdated = a.lastCommentedOn || a.createdAt;
      const bLastUpdated = b.lastCommentedOn || b.createdAt;
      return bLastUpdated.valueOf() - aLastUpdated.valueOf();
    });
    return m('.SummaryRow', [
      m('.topic', [
        m('h3', {
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeId()}/discussions/${encodeURI(topic.name)}`);
          },
        }, topic.name),
        m('p', topic.description)
      ]),
      m(
        '.recent-threads',
        sortedThreads.slice(0, 3).map((thread) => {
          const discussionLink = getProposalUrlPath(thread.slug, `${thread.identifier}-${slugify(thread.title)}`);
          return m('.thread-summary', [
            link('a.discussion-title', discussionLink, thread.title),
            m('.last-updated', [
              m('span', formatLastUpdated(getLastUpdated(thread))),
              isHot(thread) && m('span', '🔥'),
            ])
          ]);
        })
      ),
    ]);
  },
};

export const SummaryListing: m.Component<
  { recentThreads: OffchainThread[] },
  {}
> = {
  view: (vnode) => {
    const topicScopedThreads = {};
    const topics = app.topics.getByCommunity(app.activeId());
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
    return m('.SummaryListing', [
      m('.row-header', [
        m('h4.topic', 'Topic'),
        m('h4.recent-threads', 'Recent threads'),
      ]),
      m(
        '.row-wrap',
        sortedTopics.map((topic: OffchainTopic) => {
          return m(SummaryRow, {
            topic,
            monthlyThreads: topicScopedThreads[topic.id],
          });
        })
      ),
    ]);
  },
};
