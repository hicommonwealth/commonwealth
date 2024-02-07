import Web3 from 'web3';
import {
  SignTypedDataVersion,
  signTypedData,
  personalSign,
} from '@metamask/eth-sig-util';

export class MockMetaMaskProvider {
  private privateKey: string;
  private web3: Web3;

  constructor(host: string, pkey: string) {
    this.privateKey = pkey;
    this.web3 = new Web3(new Web3.providers.HttpProvider(host));
    this.web3.defaultAccount =
      this.web3.eth.accounts.privateKeyToAccount(pkey).address;
  }

  private async signTypedData(data: string[]) {
    if (data[0] == this.web3.defaultAccount) {
      return signTypedData({
        privateKey: Buffer.from(this.privateKey.substring(2), 'hex'),
        data: JSON.parse(data[1]),
        version: 'V4' as SignTypedDataVersion,
      });
    }
  }

  private async personalSign(data: string[]) {
    if (data[0] == this.web3.defaultAccount) {
      return personalSign({
        privateKey: Buffer.from(this.privateKey.substring(2), 'hex'),
        data: data[1],
      });
    }
  }

  public async request(payload: { method: string; params: string[] }) {
    switch (payload.method) {
      case 'eth_getBlockByNumber':
        return await this.web3.eth.getBlock('latest');
      case 'eth_requestAccounts':
        return [this.web3.defaultAccount];
      case 'wallet_switchEthereumChain':
        return this.web3.eth.getChainId();
      case 'eth_signTypedData_v4':
        return this.signTypedData(payload.params);
      case 'personal_sign':
        return this.personalSign(payload.params);
      default:
        throw Error(
          `method "${payload.method}" not supported by mock provider`
        );
    }
  }

  public async on(action: string, cb: any) {
    return true;
  }
}
