import express from 'express';
import {
  checkEligibility,
  contestCard,
  viewLeaderboard,
} from './frames/contest';
import { resultGame, startGame } from './frames/gameExample';

const farcasterRouter = express.Router();

farcasterRouter.get('/:contest_address/contestCard', contestCard);
farcasterRouter.post('/:contest_address/contestCard', contestCard);
farcasterRouter.post('/:contest_address/viewLeaderboard', viewLeaderboard);
farcasterRouter.post('/:contest_address/checkEligibility', checkEligibility);

farcasterRouter.get('/:contest_address/game', startGame);
farcasterRouter.post('/:contest_address/game', startGame);
farcasterRouter.post('/:contest_address/result', resultGame);

export default farcasterRouter;
