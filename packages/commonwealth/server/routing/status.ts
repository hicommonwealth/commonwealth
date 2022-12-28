import { Express } from 'express';
import Router from 'express/lib/router/index';
import { DB } from 'commonwealth/server/models';
import { getNotificationCategories } from '../routes/getNotificationCategories';
import { getInviteCodes, getInviteCodesValidation } from '../routes/getInviteCodes';
import { getChainCategoryTypes } from '../routes/getChainCategoryTypes';
import { getChainCategories } from '../routes/getChainCategories';

// contains routes for getting state of app
export function addStatusRoutes(
  router: Router,
  app: Express,
  models: DB
): Router {
  router.get('/notificationCategories', getNotificationCategories.bind(this, models));
  router.get('/inviteCodes', getInviteCodesValidation, getInviteCodes.bind(this, models));
  router.get('/chainCategoryTypes', getChainCategoryTypes.bind(this, models));
  router.get('/chainCategories', getChainCategories.bind(this, models));
  router.get('/notificationCategories', getNotificationCategories.bind(this, models));

  return router;
}

