// import { Request, Response, NextFunction } from 'express';
// import validateChain from '../util/validateChain';
// import { factory, formatFilename } from 'common-common/src/logging';
// import { DB } from '../database';
//
// const log = factory.getLogger(formatFilename(__filename));
//
// export const Errors = {
//   NotLoggedIn: 'Not logged in',
//   InvalidChainOrCommunity: 'Invalid chain or community',
//   NoMembership: 'Membership does not exist',
// };
//
// const deleteMembership = async (models: DB, req: Request, res: Response, next: NextFunction) => {
//   const [chain, community, error] = await validateChain(models, req.body);
//   if (error) return next(new Error(error));
//   if (!req.user) return next(new Error(Errors.NotLoggedIn));
//
//   // Privacy check: Cannot join a private community, but we shouldn't reveal the existence of private communities here
//   if (community && community.privacy_enabled) return next(new Error(Errors.InvalidChainOrCommunity));
//
//   const existingMembership = await models.Membership.findOne({ where: chain ? {
//     user_id: req.user.id,
//     chain: chain.id,
//   } : {
//     user_id: req.user.id,
//     community: community.id,
//   } });
//   if (!existingMembership) return next(new Error(Errors.NoMembership));
//
//   await existingMembership.destroy();
//   return res.json({ status: 'Success' });
// };
//
// export default deleteMembership;
