import { Router } from 'express';
import {
  advanceTimestamp,
  getAccounts,
  getBlock,
  getETH,
} from './routes/chain';
import { approve, getBalance, getTokens, transfer } from './routes/erc20';
import {
  cancelProposal,
  castVote,
  createProposal,
  executeProposal,
  getProposalDetails,
  getVotes,
  queueProposal,
  runFullCycle,
} from './routes/gov';

function setupRouter(): Router {
  const router = Router();

  // Chain Info Routes
  router.get('/chain/accounts', getAccounts);
  router.get('/chain/block', getBlock);
  router.post('/chain/advanceTime', advanceTimestamp);
  router.post('/chain/getEth', getETH);
  // Token Routes
  router.post('/erc20/balance', getBalance);
  router.post('/erc20/transfer', transfer);
  router.post('/erc20/approve', approve);

  // DEX Routes
  router.post('/erc20/dex/getTokens', getTokens);

  //Governance Routes
  router.post('/gov/compound/createProposal', createProposal);
  router.post('/gov/compound/cancelProposal', cancelProposal);
  router.post('/gov/compound/castVote', castVote);
  router.post('/gov/compound/proposalDetails', getProposalDetails);
  router.post('/gov/compound/getVotes', getVotes);
  router.post('/gov/compound/queue', queueProposal);
  router.post('/gov/compound/execute', executeProposal);
  router.get('/gov/compound/runFullCylce', runFullCycle);

  return router;
}

export default setupRouter;
