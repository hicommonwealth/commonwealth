/* eslint-disable no-unused-expressions */
import 'pages/discussions.scss';

import _ from 'lodash';
import m from 'mithril';

import app from 'state';
import DiscussionRow from 'views/pages/discussions/discussion_row';

interface IWeeklyDiscussionListingAttrs {
  isCurrentWeek: boolean;
  isFirstWeek: boolean;
  heading: any;
  lastVisited?: any;
  proposals: any;
}

interface IWeeklyDiscussionListingState {
  expanded: boolean;
  visitMarkerPlaced: boolean ;
}

export const getLastUpdate = (proposal) => {
  const lastComment = Number(app.comments.lastCommented(proposal));
  const createdAt = Number(proposal.createdAt.utc());
  const lastUpdate = Math.max(createdAt, lastComment);
  return lastUpdate;
};

const WeeklyDiscussionListing: m.Component<IWeeklyDiscussionListingAttrs, IWeeklyDiscussionListingState> = {
  view: (vnode) => {
    const activeEntity = app.community ? app.community : app.chain;
    const { isCurrentWeek, isFirstWeek, heading, lastVisited } = vnode.attrs;
    vnode.state.visitMarkerPlaced = false;
    // comparators
    const orderDiscussionsbyLastComment = (a, b) => {
      // tslint:disable-next-line
      const tsB = Math.max(+b.createdAt, +(app.comments.lastCommented(b) || 0));
      const tsA = Math.max(+a.createdAt, +(app.comments.lastCommented(a) || 0));
      return tsB - tsA;
    };

    const proposals = vnode.attrs.proposals.sort(orderDiscussionsbyLastComment);
    const firstProposal = proposals[0];
    const lastProposal = proposals[proposals.length - 1];
    const isEntireWeekSeen = () => getLastUpdate(firstProposal) < lastVisited;
    const isEntireWeekUnseen = () => getLastUpdate(lastProposal) > lastVisited;

    const discussionRow = (proposal) => m(DiscussionRow, { proposal });
    const LastSeenDivider = m('.LastSeenDivider', [ m('hr'), m('span', 'New posts'), m('hr') ]);
    const threadGroup = '.discussion-group-wrap';

    const proposalsByLastViewed = () => {
      let sortedProposals = [];
      if (isEntireWeekUnseen()) {
        return [m(threadGroup, proposals.map(discussionRow)), LastSeenDivider];
      }
      if (isEntireWeekSeen()) {
        return (isCurrentWeek || isFirstWeek)
          ? m(threadGroup, proposals.map(discussionRow))
          : [LastSeenDivider, m(threadGroup, proposals.map(discussionRow))];
      }

      let visitMarkerPlaced = false;
      proposals.forEach((proposal) => {
        const newestSeenPost = (getLastUpdate(proposal) < lastVisited && !visitMarkerPlaced);
        const row = m(DiscussionRow, { proposal });
        if (newestSeenPost) {
          sortedProposals = [
            m(threadGroup, sortedProposals),
            LastSeenDivider,
            m(threadGroup, [row])
          ];
          visitMarkerPlaced = true;
        } else {
          visitMarkerPlaced ? sortedProposals[2].children.push(row) : sortedProposals.push(row);
        }
      });
      return sortedProposals;
    };

    if (proposals.length === 0) {
      return;
    }
    return m('.WeeklyDiscussionListing', [
      m('h4', heading),
      vnode.attrs.lastVisited
        ? m('div', proposalsByLastViewed())
        : m(threadGroup, proposals.map((proposal) => {
          return m(DiscussionRow, { proposal });
        }))
    ]);
  },
};

export default WeeklyDiscussionListing;
