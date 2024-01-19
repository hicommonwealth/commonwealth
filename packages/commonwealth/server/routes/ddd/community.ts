import { expressCommand } from '@hicommonwealth/adapters';
import { Community } from '@hicommonwealth/model';
import { Router } from 'express';

const router = Router();

router.put('/:id', expressCommand(Community.CreateCommunity));

router.post(
  '/set-community-namespace/:id',
  expressCommand(Community.SetCommunityNamespace),
);

export default router;
