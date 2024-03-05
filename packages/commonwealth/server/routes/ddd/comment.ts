import { express, trpc } from '@hicommonwealth/adapters';
import { Comment } from '@hicommonwealth/model';
import { Router } from 'express';

export const expressRouter = Router();
expressRouter.get('/search', express.query(Comment.SearchComments()));

export const trpcRouter = trpc.router({
  searchComments: trpc.query(Comment.SearchComments),
});
