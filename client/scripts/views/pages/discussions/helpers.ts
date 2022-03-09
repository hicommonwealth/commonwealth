import moment from 'moment';

export const getLastUpdated = (proposal) => {
  const { lastCommentedOn } = proposal;
  const lastComment = lastCommentedOn ? Number(lastCommentedOn.utc()) : 0;
  const createdAt = Number(proposal.createdAt.utc());
  const lastUpdate = Math.max(createdAt, lastComment);
  return moment(lastUpdate);
};

export const isHot = (proposal) => {
  return (
    moment.duration(moment().diff(getLastUpdated(proposal))).asSeconds() <
    24 * 60 * 60
  );
};
