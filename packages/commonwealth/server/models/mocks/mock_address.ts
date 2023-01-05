import { WalletId } from '../../../../common-common/src/types';
import { ChainAttributes } from '../chain';
import { OffchainProfileAttributes } from '../offchain_profile';
import { RoleAssignmentAttributes } from '../role_assignment';
import { SsoTokenAttributes } from '../sso_token';
import { UserAttributes } from '../user';
import { AddressAttributes } from '../address';
import { MockModel } from './mock_model';

export class MockAddress implements MockModel {
  private addressModel;

  constructor(sequelizeMock) {
    const defaultAttributes: AddressAttributes = {
      user_id: 1,
      chain: 'ethereum',
      address: '0x123',
      verified: new Date('2020-01-01'),
      verification_token: 'test-token',
      name: 'test-user',
    };

    const AddressMock: any = sequelizeMock.define('address', defaultAttributes);

    AddressMock.$queryInterface.$useHandler(function (
      query,
      queryOptions,
      done
    ) {
      if (query === 'findOne') {
        if (queryOptions[0].where.address === 'not-found') {
          return null;
        }
      }
    });

    this.addressModel = AddressMock;
  }

  public getModel() {
    return this.addressModel;
  }
}
