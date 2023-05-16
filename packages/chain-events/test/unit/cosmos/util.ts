import type { Block } from '@cosmjs/tendermint-rpc';

import type { Api } from 'chain-events/src/chain-bases/cosmos/types';

export type MockBlock = {
  block: {
    header: { height: number };
    txs: Uint8Array[];
  };
};

export function getApi(blocks: MockBlock[]): Api {
  return {
    tm: {
      block: (height?: number) => {
        if (!height) {
          return blocks[0] as unknown as Block;
        }

        const ret = blocks.find((b) => b.block.header.height === height);
        if (ret) return ret as unknown as Block;
        throw new Error('Unknown block!');
      },
    },
    lcd: {
      gov: {
        proposals: () => {},
        votes: () => {},
        deposits: () => {},
      },
    },
  } as unknown as Api;
}
