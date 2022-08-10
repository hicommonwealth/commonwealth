import moment from 'moment';

import { Thread } from 'models';

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

export const getLastUpdate = (proposal: Thread): number => {
  const lastComment = proposal.lastCommentedOn?.unix() || 0;
  const createdAt = proposal.createdAt?.unix() || 0;
  const lastUpdate = Math.max(createdAt, lastComment);
  return lastUpdate;
};

export const onFeaturedDiscussionPage = (p, topic) =>
  decodeURI(p).endsWith(`/discussions/${topic}`);

export const orderDiscussionsbyLastComment = (a, b) => {
  const tsB = Math.max(+b.createdAt, +(b.lastCommentedOn || 0));
  const tsA = Math.max(+a.createdAt, +(a.lastCommentedOn || 0));
  return tsB - tsA;
};
