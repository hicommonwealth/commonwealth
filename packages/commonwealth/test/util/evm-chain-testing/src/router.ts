import { Router } from 'express';
import {
  advanceTimestamp,
  getAccounts,
  getBlock,
  getETH,
} from './routes/chain';
import { deploy1155, mint1155 } from './routes/erc1155';
import { approve, getBalance, getTokens, transfer } from './routes/erc20';
import {
  approve721,
  deploy721,
  mintBurn721,
  transfer721,
} from './routes/erc721';
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

  router.post('/gov/aave/createProposal', createProposal);
  router.post('/gov/aave/cancelProposal', cancelProposal);
  router.post('/gov/aave/getVotes', getVotes);
  router.post('/gov/aave/castVote', castVote);
  router.post('/gov/aave/proposalDetails', getProposalDetails);
  router.post('/gov/aave/queue', queueProposal);
  router.post('/gov/aave/execute', executeProposal);
  router.get('/gov/aave/runFullCylce', runFullCycle);

  router.post('/erc721/approve', approve721);
  router.post('/erc721/transfer', transfer721);
  router.get('/erc721/deploy', deploy721);
  router.post('/erc721/mintBurn', mintBurn721);

  router.get('/erc1155/deploy', deploy1155);
  router.post('/erc1155/mint', mint1155);

  return router;
}

export default setupRouter;
