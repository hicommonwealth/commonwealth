import { Router } from 'express';
import { setCommunityNamespace } from '../../community/set-community-namespace';
import { isCommunityAuthor } from '../../middleware/isCommunityAuthor';
import { loadCommunity } from '../../middleware/loadCommunity';
import { command } from './command';

const router = Router();

router.post(
  '/set-community-namespace/:id',
  command(setCommunityNamespace, [loadCommunity, isCommunityAuthor]),
);

export default router;
