import Web3 from 'web3';
import { Account, HttpProvider } from 'web3-core';
import { SignTypedDataVersion, signTypedData } from '@metamask/eth-sig-util';

class MockMetaMaskProvider extends HttpProvider {
    public w3_temp: Web3;
    private pAccount: Account;

    constructor(rpcUrl: string, pkey: string) {
      super(rpcUrl);
      this.w3_temp = new Web3(this)
      this.pAccount = this.w3_temp.eth.accounts.privateKeyToAccount(pkey);
      this.w3_temp.defaultAccount = this.pAccount.address;
    }

    private async signTypedData(data: string[]){
        if(data[0] == this.w3_temp.defaultAccount){
            return signTypedData({
                privateKey: Buffer.from(this.pAccount.privateKey.substring(2), 'hex'),
                data: JSON.parse(data[1]),
                version: 'V4' as SignTypedDataVersion
            })
        }
    }
    public async request(payload: {method: string, params: string[]}) {
        switch(payload.method){
            case 'eth_getBlockByNumber':
                return (await this.w3_temp.eth.getBlock('latest'))
            case 'eth_requestAccounts':
                return (await this.w3_temp.eth.getAccounts())
            case 'wallet_switchEthereumChain':
                return this.w3_temp.eth.getChainId();
            case 'eth_signTypedData_v4':
                return this.signTypedData(payload.params)
            default:
                throw Error("method not supported by mock provider")
        }
    }     
}

export const getMetaMaskMock = (rpc: string, pkey: string) => {
    const provider = new MockMetaMaskProvider(rpc, pkey);
    return provider.w3_temp;
}