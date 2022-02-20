// import { Request, Response, NextFunction } from 'express';
// import validateChain from '../util/validateChain';
// import { factory, formatFilename } from '../../shared/logging';
// import { DB } from '../database';
//
// const log = factory.getLogger(formatFilename(__filename));
//
// export const Errors = {
//   InvalidChain: 'Invalid chain or community',
//   NotLoggedIn: 'Not logged in',
//   MemberAlreadyExists: 'Membership already exists',
// };
//
// const createMembership = async (models: DB, req: Request, res: Response, next: NextFunction) => {
//   const [chain, community, error] = await validateChain(models, req.body);
//   if (error) return next(new Error(error));
//   if (!req.user) return next(new Error(Errors.NotLoggedIn));
//
//   // Privacy check: Cannot join a private community, but we shouldn't reveal the existence of private communities here
//   if (community && community.privacy_enabled) return next(new Error(Errors.InvalidChain));
//
//   const existingMembership = await models.Membership.findOne({ where: chain ? {
//     user_id: req.user.id,
//     chain: chain.id,
//   } : {
//     user_id: req.user.id,
//     community: community.id,
//   } });
//   if (existingMembership) return next(new Error(Errors.MemberAlreadyExists));
//
//   // We should require an address to be created when joining a community.
//   // For now, we can just let people join without one, and prompt them to create one afterwards.
//   //
//   // if (chain) {
//   //   const validAddresses = await models.Address.findAll({
//   //     where: {
//   //       chain: chain.id,
//   //       user_id: req.user.id,
//   //       verified: { [Op.ne]: null }
//   //     }
//   //   });
//   //   if (validAddresses.length === 0) return next(new Error('Verified address required'));
//   // } else if (community) {
//   //   const validAddresses = await models.Address.findAll({
//   //     where: {
//   //       user_id: req.user.id,
//   //       verified: { [Op.ne]: null }
//   //     }
//   //   });
//   //   if (validAddresses.length === 0) return next(new Error('Verified address required'));
//   // }
//
//   const membership = await models.Membership.create(chain ? {
//     user_id: req.user.id,
//     chain: chain.id,
//   } : {
//     user_id: req.user.id,
//     community: community.id,
//   });
//
//   return res.json({ status: 'Success', result: membership.toJSON() });
// };
//
// export default createMembership;
