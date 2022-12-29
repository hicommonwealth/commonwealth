import chai from 'chai';
import { app } from '../hooks/appHook.spec';
import { AppConfig } from '../../../client/scripts/AppConfig';
import {
  testChainCategories,
  testChainCategoryTypes, testChainNodes, testChains, testInviteCodes,
  testNotificationCategories,
  testThreads
} from '../hooks/dbEntityHooks.spec';
import { NotificationCategory } from '../../../client/scripts/models/index';
import 'chai/register-should';
import { ChainCategoryTypeAttributes } from '../../../server/models/chain_category_type';
import { ChainCategoryAttributes } from '../../../server/models/chain_category';

const appState: AppConfig = new AppConfig('http://127.0.0.1:3001/api');
describe('AppConfig Tests', () => {
  before(() => {
    app.listen(3001, ()=>{
      console.log('server running at 3000')
    });
  });

  it('getChain works correctly', async () => {
    const chains = await appState.getChain(testChains[0].id);

    chai.assert.equal(chains.id, testChains[0].id)
  });

  it('getChainNodes works correctly', async () => {
    const chainNodes = await appState.getChainNodes(testChains[0].id);

    chai.assert.equal(chainNodes.length, 1);
    chai.assert.equal(chainNodes[0].id, testChainNodes[0].id)
    chai.assert.equal(chainNodes[0].name, testChainNodes[0].name)
  });

  it('getRoles works correctly', async () => {
    const roles = await appState.getRoles(testChains[0].id);

    chai.assert.equal(roles.length, 1);
  });

  it('getInvites works correctly', async () => {
    const invites = await appState.getInvites(testInviteCodes[0].chain_id);

    chai.assert.equal(invites.length, 1);
  });

  it('getThreadCount works correctly', async () => {
    const threadCount: number = await appState.getThreadCount(testThreads[0].chain);

    chai.assert.equal(threadCount, 5);
  });

  it('getChainCategories works correctly', async () => {
    const chainCategories: ChainCategoryAttributes[] = await appState.getChainCategories();

    const data = chainCategories.filter(n => n.id === testChainCategories[0].id);

    chai.assert.equal(data.length, 1);
  });

  it('getChainCategoryTypes works correctly', async () => {
    const chainCategoryTypes: ChainCategoryTypeAttributes[] = await appState.getChainCategoryTypes();

    const data = chainCategoryTypes.filter(n => n.id === testChainCategoryTypes[0].id);

    chai.assert.equal(data.length, 1);
  });

  it('getNotificationCategories works correctly', async () => {
    const notificationCategories: NotificationCategory[] = await appState.getNotificationCategories();

    const data = notificationCategories.filter(n => n.name === testNotificationCategories[0].name);

    chai.assert.equal(data.length, 1);
  });
});