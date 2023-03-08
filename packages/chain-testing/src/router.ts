import { Router } from 'express';
import { approve, getBalance, getTokens, transfer } from './routes/erc20';
import { createProposal } from './routes/gov';


function setupRouter(): Router {
  const router = Router();
  // Token Routes
  router.post('/erc20/balance', getBalance);
  router.post('/erc20/transfer', transfer)
  router.post('/erc20/approve', approve)
  // DEX Routes
  router.post('/erc20/dex/getTokens', getTokens);
  //Governance Routes
  router.get('/gov/compound/createProposal', createProposal)
  return router;
}

export default setupRouter;
