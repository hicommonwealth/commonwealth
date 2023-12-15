import { Router } from 'express';
import { createCommunity, setCommunityNamespace } from '../../community';
import { isCommunityAuthor } from '../../middleware/isCommunityAuthor';
import { loadCommunity } from '../../middleware/loadCommunity';
import { command } from './command';

const router = Router();

router.put('/:id', command(createCommunity, []));
router.post(
  '/set-community-namespace/:id',
  command(setCommunityNamespace, [loadCommunity, isCommunityAuthor]),
);

export default router;
