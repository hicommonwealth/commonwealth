import { IPostNotificationData, IChainEventNotificationData, NotificationCategories } from './types';
import { getProposalUrl, renderQuillDeltaToText, smartTrim, formatAddressShort } from './utils';

import { SERVER_URL } from '../server/config';

// forum notification format:
// raymondz (mae7...) commented on 'Example Thread' in Edgeware

export const getForumNotificationCopy = async (models, notification_data: IPostNotificationData, category_id) => {
  // unpack notification_data
  const {
    created_at, root_id, root_title, root_type, comment_id, comment_text,
    chain_id, community_id, author_address, author_chain
  } = notification_data;

  // title
  const decodedTitle = decodeURIComponent(root_title).trim();

  // email subject line
  const emailSubjectLine = ((category_id === NotificationCategories.NewComment) ? `Comment on: ${decodedTitle}`
    : (category_id === NotificationCategories.NewMention) ? `You were mentioned in: ${decodedTitle}`
      : (category_id === NotificationCategories.NewThread) ? `New thread: ${decodedTitle}`
        : 'New activity on Commonwealth');

  // author
  const authorProfile = await models.OffchainProfile.findOne({
    include: [{
      model: models.Address,
      where: { address: author_address, chain: author_chain },
      required: true,
    }]
  });
  let authorName;
  const author_addr_short = formatAddressShort(author_address, author_chain);
  try {
    authorName = authorProfile.Address.name || JSON.parse(authorProfile.data).name || author_addr_short;
  } catch (e) {
    authorName = author_addr_short;
  }

  // author profile link
  const authorPath = `https://commonwealth.im/${author_chain}/account/${author_address}?base=${author_chain}`;

  // action and community
  const actionCopy = (([NotificationCategories.NewComment, NotificationCategories.CommentEdit].includes(category_id)) ? 'commented on'
    : (category_id === NotificationCategories.NewMention) ? 'mentioned you in the thread'
      : [NotificationCategories.ThreadEdit, NotificationCategories.NewThread].includes(category_id) ? 'created a new thread'
        : null);
  const objectCopy = decodeURIComponent(root_title).trim();
  const communityObject = chain_id
    ? await models.Chain.findOne({ where: { id: chain_id } })
    : await models.OffchainCommunity.findOne({ where: { id: community_id } });
  const communityCopy = communityObject ? `in ${communityObject.name}` : '';
  const excerpt = (() => {
    const text = decodeURIComponent(comment_text);
    try {
      // return rendered quill doc
      const doc = JSON.parse(text);
      const finalText = renderQuillDeltaToText(doc);
      return smartTrim(finalText);
    } catch (e) {
      // return markdown
      return smartTrim(text);
    }
  })();

  // link to proposal
  const pseudoProposal = {
    id: root_id,
    title: root_title,
    chain: chain_id,
    community: community_id,
  };
  const proposalUrlArgs = comment_id ? [root_type, pseudoProposal, { id: comment_id }] : [root_type, pseudoProposal];
  const proposalPath = (getProposalUrl as any)(...proposalUrlArgs);

  return [emailSubjectLine, authorName, actionCopy, objectCopy, communityCopy, excerpt, proposalPath, authorPath];
};

// chain event label: (chainEventLabel?.heading)
// chain event path:
// chainEventLabel?.linkUrl ? `${SERVER_URL}${chainEventLabel.linkUrl}`
// : chainEventLabel ? `${SERVER_URL}/${chainId}`
