import { Router } from 'express';
import {
  advanceTimestamp,
  getAccounts,
  getBlock,
  getChainSnapshot,
  getETH,
  revertChainToSnapshot,
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
  router.post('/chain/getEth', getETH);

  // Chain Management Routes
  router.post('/chain/advanceTime', advanceTimestamp);
  router.get('/chain/getChainSnapshot', getChainSnapshot);
  router.post('/chain/revertChainToSnapshot', revertChainToSnapshot);

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

  router.post('/gov/aave/createProposal', createProposal);
  router.post('/gov/aave/cancelProposal', cancelProposal);
  router.post('/gov/aave/getVotes', getVotes);
  router.post('/gov/aave/castVote', castVote);
  router.post('/gov/aave/proposalDetails', getProposalDetails);
  router.post('/gov/aave/queue', queueProposal);
  router.post('/gov/aave/execute', executeProposal);
  router.get('/gov/aave/runFullCylce', runFullCycle);

  return router;
}

export default setupRouter;
