import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const deleteThread = async (models, req: Request, res: Response, next: NextFunction) => {
  const { }
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!thread_id) {
    return next(new Error('Must provide thread_id'));
  }

  try {
    const userOwnedAddresses = await req.user.getAddresses();
    const thread = await models.OffchainThread.findOne({
      where: { id: req.body.thread_id, },
      include: [ models.Chain, models.OffchainCommunity ]
    });
    if (userOwnedAddresses.filter((addr) => addr.verified).map((addr) => addr.id).indexOf(thread.author_id) === -1) {
      return next(new Error('Not owned by this user'));
    }
    const tag = await models.OffchainTag.findOne({
      where: { id: thread.tag_id },
    });
    // const activeEntity = req.body.community
    //     ? await models.OffchainCommunity.findOne({ where: { id: community.id } })
    //     : await models.Chain.findOne({ where: { id: chain.id } });
    console.log(thread);
    const featuredTags = (thread.Chain || thread.OffchainCommunity).featured_tags;
    console.log(featuredTags);
    console.log(typeof featuredTags[0]);
    if (tag && !featuredTags.includes(tag.id)) {
      tag.destroy();
    }
    await thread.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteThread;
