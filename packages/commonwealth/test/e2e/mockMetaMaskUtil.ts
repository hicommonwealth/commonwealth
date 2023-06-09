import Web3 from 'web3';
import { SignTypedDataVersion, signTypedData } from '@metamask/eth-sig-util';

class MockMetaMaskProvider {
    private privateKey;
    private web3: Web3;
    public eth;

    constructor(host: string, pkey: string) {
      this.privateKey = pkey;
      this.web3 = new Web3(new Web3.providers.HttpProvider(host))
      this.web3.defaultAccount = this.web3.eth.accounts.privateKeyToAccount(pkey).address;
      const getAccounts = async () => {return [this.web3.defaultAccount]} 
      this.eth = {getAccounts: getAccounts()}
    }

    private async signTypedData(data: string[]){
        if(data[0] == this.web3.defaultAccount){
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
                return (await this.web3.eth.getBlock('latest'))
            case 'eth_requestAccounts':
                return [this.web3.defaultAccount]
            case 'wallet_switchEthereumChain':
                return this.web3.eth.getChainId();
            case 'eth_signTypedData_v4':
                return this.signTypedData(payload.params)
            default:
                throw Error("method not supported by mock provider")
        }
    }     
}
