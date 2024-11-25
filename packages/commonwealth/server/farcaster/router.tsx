import express from 'express';
import { checkEligibility, contestCard, contestPrizes } from './frames/contest';

const farcasterRouter = express.Router();

// WARNING: do not change these paths because cloudflare may route to it
farcasterRouter.get('/:contest_address/contestCard', contestCard);
farcasterRouter.post('/:contest_address/contestCard', contestCard);
farcasterRouter.post('/:contest_address/contestPrizes', contestPrizes);
farcasterRouter.post('/:contest_address/checkEligibility', checkEligibility);

export default farcasterRouter;
