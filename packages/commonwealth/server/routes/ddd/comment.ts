import { expressQuery } from '@hicommonwealth/adapters';
import { Comment } from '@hicommonwealth/model';
import { Router } from 'express';

const router = Router();

router.get('/search', expressQuery(Comment.SearchComments()));

export default router;
