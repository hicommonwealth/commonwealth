/* eslint-disable @typescript-eslint/ban-types */
import 'pages/discussions/summary_listing.scss';
import app from 'state';
import m from 'mithril';
import moment from 'moment';
import { OffchainThread, OffchainTopic } from 'models';
import { link } from 'helpers';
import { slugify } from 'utils';

const SummaryRow: m.Component<
  {
    topic: OffchainTopic;
    monthlyThreads: OffchainThread[];
    activitySummary;
  },
  {}
> = {
  view: (vnode) => {
    const { topic, monthlyThreads, activitySummary } = vnode.attrs;
    if (!topic?.name) return null;
    const sortedThreads = monthlyThreads.map((thread) => {
      return Object.assign(thread, { lastUpdated: moment(activitySummary[thread.id]?.lastUpdated) });
    }).sort((a, b) => {
      return b.lastUpdated.valueOf() - a.lastUpdated.valueOf();
    });
    const mostRecentUpdate = sortedThreads[0]?.lastUpdated;
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
          const discussionLink =
            `/${app.activeId()}/proposal/${thread.slug}/${thread.identifier}-` +
            `${slugify(thread.title)}`;
          return m('.thread-summary', [
            link('a', discussionLink, thread.title),
            m('span', thread.lastUpdated.format('MMM D YYYY')),
          ]);
        })
      ),
    ]);
  },
};

export const SummaryListing: m.Component<
  { recentThreads: { threads: OffchainThread[]; activitySummary } },
  {}
> = {
  view: (vnode) => {
    const topicScopedThreads = {};
    const topics = app.topics.getByCommunity(app.activeId());
    topics.forEach((topic) => {
      topicScopedThreads[topic.id] = vnode.attrs.recentThreads.threads.filter(
        (thread) => thread.topic?.id === topic?.id
      );
    });
    const sortedTopics = topics.sort((a, b) => {
      return (
        topicScopedThreads[b.id]?.length - topicScopedThreads[a.id]?.length
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
            activitySummary: vnode.attrs.recentThreads.activitySummary,
          });
        })
      ),
    ]);
  },
};
