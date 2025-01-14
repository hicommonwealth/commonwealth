import express from 'express';
import { contestCard, contestPrizes } from './frames/contest';
import v2Router from './frames/v2/frameRouter.js';

const farcasterRouter = express.Router();

// v2 frame routes
farcasterRouter.use('/v2', v2Router);

// WARNING: do not change these paths because cloudflare may route to it
// v1 frame routes
farcasterRouter.get('/:contest_address/contestCard', contestCard);
farcasterRouter.post('/:contest_address/contestCard', contestCard);
farcasterRouter.post('/:contest_address/contestPrizes', contestPrizes);

export default farcasterRouter;
