import Web3 from 'web3';
import { SignTypedDataVersion, signTypedData } from '@metamask/eth-sig-util';
import { Account, HttpProvider } from 'web3-core';

class MockMetaMaskProvider extends Web3 {
    private privateKey;

    constructor(host: string, pkey: string) {
      super(new Web3.providers.HttpProvider(host));
      this.privateKey = pkey;
      this.defaultAccount = this.eth.accounts.privateKeyToAccount(pkey).address;
      this.givenProvider.request = this.request;
    }

    private async signTypedData(data: string[]){
        if(data[0] == this.defaultAccount){
            return signTypedData({
                privateKey: Buffer.from(this.privateKey.substring(2), 'hex'),
                data: JSON.parse(data[1]),
                version: 'V4' as SignTypedDataVersion
            })
        }
    }
    public async request(payload: {method: string, params: string[]}) {
        switch(payload.method){
            case 'eth_getBlockByNumber':
                return (await this.eth.getBlock('latest'))
            case 'eth_requestAccounts':
                return (await this.eth.getAccounts())
            case 'wallet_switchEthereumChain':
                return this.eth.getChainId();
            case 'eth_signTypedData_v4':
                return this.signTypedData(payload.params)
            default:
                throw Error("method not supported by mock provider")
        }
    }     
}

export const getMetaMaskMock = (rpc: string, pkey: string) => {
    return new MockMetaMaskProvider(rpc, pkey)
}