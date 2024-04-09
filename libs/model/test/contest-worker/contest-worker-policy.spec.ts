import { eventHandler } from '@hicommonwealth/core';
import { ContestWorker } from '@hicommonwealth/model';

import { commonProtocol } from '@hicommonwealth/model';
import { expect } from 'chai';
import Sinon from 'sinon';
import Web3 from 'web3';

Sinon.stub(commonProtocol.contestHelper, 'createWeb3Provider').resolves(
  new Web3(),
);

describe('Contest Worker Policy', () => {
  afterEach(() => {
    Sinon.resetHistory();
  });

  it('ThreadCreated event should invoke addContent protocol function', async () => {
    const addContentStub = Sinon.stub(
      commonProtocol.contestHelper,
      'addContent',
    ).callsFake(
      async (web3: Web3, contest: string, creator: string, url: string) => {
        return {
          txReceipt: 'aaa',
          contentId: 'bbb',
        };
      },
    );

    await eventHandler(
      ContestWorker(),
      {
        name: 'ThreadCreated',
        payload: {
          userAddress: '0x0',
          contentUrl: '/ethereum/discussion/1',
          contestAddress: '0x1',
          chainNodeUrl: 'https://chain',
        },
      },
      true,
    );

    const fnArgs = addContentStub.args[0];
    expect(fnArgs[1]).to.equal('0x1', 'contractAddress');
    expect(fnArgs[2]).to.equal('0x0', 'userAddress');
    expect(fnArgs[3]).to.equal('/ethereum/discussion/1', 'contentUrl');
  });

  it('ThreadUpvoted event should invoke voteContent protocol function', async () => {
    const voteContentStub = Sinon.stub(
      commonProtocol.contestHelper,
      'voteContent',
    ).resolves('abc');

    await eventHandler(ContestWorker(), {
      name: 'ThreadUpvoted',
      payload: {
        userAddress: '0x0',
        contestAddress: '0x1',
        contentId: 'zzz',
        chainNodeUrl: 'https://chain',
      },
    });

    const fnArgs = voteContentStub.args[0];
    expect(fnArgs[1]).to.equal('0x1', 'contractAddress');
    expect(fnArgs[2]).to.equal('0x0', 'userAddress');
    expect(fnArgs[3]).to.equal('zzz', 'contentId');
  });
});
