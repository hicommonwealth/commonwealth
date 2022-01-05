/* eslint-disable @typescript-eslint/ban-types */
import 'pages/discussions/summary_listing.scss';
import app from 'state';
import m from 'mithril';
import { OffchainThread, OffchainTopic } from 'models';
import { link } from 'helpers';
import { slugify } from 'utils';
import { isHot } from './discussion_row';

const SummaryRow: m.Component<
  {
    topic: OffchainTopic;
    monthlyThreads: OffchainThread[];
  },
  {}
> = {
  view: (vnode) => {
    const { topic, monthlyThreads } = vnode.attrs;
    console.log({ topic, monthlyThreads });
    if (!topic?.name) return null;
    const sortedThreads = monthlyThreads.sort((a, b) => {
      const aLastUpdated = a.latestCommCreatedAt || a.createdAt;
      const bLastUpdated = b.latestCommCreatedAt || b.createdAt;
      return bLastUpdated.valueOf() - aLastUpdated.valueOf();
    });
    const mostRecentUpdate = sortedThreads[0]?.latestCommCreatedAt;
    return m('.SummaryRow', [
      m('.topic', [
        m('h3', topic.name),
        m('p', topic.description)
      ]),
      m('.last-updated', [
        m('.time', `${mostRecentUpdate?.format('hh:mm A') || ''}`),
        m('.date', `${mostRecentUpdate?.format('MMM D YYYY') || ''}`),
      ]),
      m(
        '.recent-threads',
        sortedThreads.slice(0, 3).map((thread) => {
          const threadLastUpdated = thread.latestCommCreatedAt || thread.createdAt;
          const discussionLink =
            `/${app.activeId()}/proposal/${thread.slug}/${thread.identifier}-` +
            `${slugify(thread.title)}`;
          return m('.thread-summary', [
            link('a', discussionLink, thread.title),
            m('span', (threadLastUpdated).format('MMM D YYYY')),
            isHot(thread) && m('span', '🔥'),
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
      return (
        topicScopedThreads[b.name] - topicScopedThreads[a.name]
      );
    });
    return m('.SummaryListing', [
      m('.row-header', [
        m('h4.topic', 'Topic'),
        m('h4.last-updated', 'Latest reply'),
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
