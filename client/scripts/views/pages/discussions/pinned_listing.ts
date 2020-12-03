/* eslint-disable no-unused-expressions */

import _ from 'lodash';
import m from 'mithril';

import app from 'state';
import DiscussionRow from 'views/pages/discussions/discussion_row';

interface IPinnedListingAttrs {
  proposals: any;
}

interface IPinnedListingState {
  expanded: boolean;
  visitMarkerPlaced: boolean ;
}

export const getLastUpdate = (proposal) => {
  const lastComment = Number(app.comments.lastCommented(proposal));
  const createdAt = Number(proposal.createdAt.utc());
  const lastUpdate = Math.max(createdAt, lastComment);
  return lastUpdate;
};

const PinnedListing: m.Component<IPinnedListingAttrs, IPinnedListingState> = {
  view: (vnode) => {
    vnode.state.visitMarkerPlaced = false;
    // comparators
    const orderDiscussionsbyDate = (a, b) => {
      // tslint:disable-next-line
      const tsB = Math.max(+b.createdAt);
      const tsA = Math.max(+a.createdAt);
      return tsA - tsB;
    };

    const proposals = vnode.attrs.proposals.sort(orderDiscussionsbyDate);

    const threadGroup = '.pinned-group.discussion-group-wrap';

    if (proposals.length === 0) {
      return;
    }
    return m('.WeeklyDiscussionListing', [
      m(threadGroup, proposals.map((proposal) => {
        return m(DiscussionRow, { proposal });
      }))
    ]);
  },
};

export default PinnedListing;
