import {
  ChainBase,
  ChainNetwork,
  ChainType,
} from '../../../../common-common/src/types';
import { ChainAttributes } from '../chain';
import { MockModel } from './mock_model';

export class MockChain implements MockModel {
  private chainModel;

  constructor(sequelizeMock) {
    const defaultAttributes: ChainAttributes = {
      name: 'ethereum',
      chain_node_id: 1,
      default_symbol: 'ETH',
      network: ChainNetwork.Ethereum,
      base: ChainBase.Ethereum,
      icon_url: 'https://example.com',
      active: true,
      type: ChainType.Chain,
      default_allow_permissions: BigInt(0),
      default_deny_permissions: BigInt(0),
    };

    const ChainMock: any = sequelizeMock.define('address', defaultAttributes);

    ChainMock.$queryInterface.$useHandler(function (
        query,
        queryOptions,
        done
      ) {
        if (query === 'findOne') {
          if (queryOptions[0].where.id === 'ethereum') {
            return ChainMock.build({ id: 'ethereum', name: 'foo' });
          }
        }
      });

    this.chainModel = ChainMock;
  }

  public getModel() {
    return this.chainModel;
  }
}
