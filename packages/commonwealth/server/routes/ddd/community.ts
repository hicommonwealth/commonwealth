import { expressCommand } from '@hicommonwealth/adapters';
import {
  Community,
  isCommunityAuthor,
  loadCommunity,
} from '@hicommonwealth/model';
import { Router } from 'express';

const router = Router();

router.put(
  '/:id',
  expressCommand(
    Community.createCommunity,
    Community.CreateCommunitySchema,
    [],
  ),
);

router.post(
  '/set-community-namespace/:id',
  expressCommand(
    Community.setCommunityNamespace,
    Community.SetCommunityNamespaceSchema,
    [loadCommunity, isCommunityAuthor],
  ),
);

export default router;
