import { Router } from 'express';
import {
  CreateCommunity,
  SetCommunityNamespace,
  createCommunity,
  setCommunityNamespace,
} from '../../community';
import { isCommunityAuthor } from '../../middleware/isCommunityAuthor';
import { loadCommunity } from '../../middleware/loadCommunity';
import { command } from './command';

const router = Router();

router.put('/:id', command(createCommunity, CreateCommunity, []));
router.post(
  '/set-community-namespace/:id',
  command(setCommunityNamespace, SetCommunityNamespace, [
    loadCommunity,
    isCommunityAuthor,
  ]),
);

export default router;
