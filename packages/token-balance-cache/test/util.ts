import { BalanceProvider, IChainNode } from '../src/types';

export class MockBalanceProvider implements BalanceProvider {
  constructor(
    public readonly name: string,
    public readonly opts: Record<string, string>,
    public readonly getBalance: (
      node: IChainNode,
      address: string,
      opts: Record<string, string>
    ) => Promise<string>,
  ) {
  }
}
