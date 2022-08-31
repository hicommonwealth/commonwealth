// Api for interacting with the DAOFactory contract on Ethereum
//
// Language: typescript
// Path: packages/commonwealth/client/scripts/controllers/chain/ethereum/daoFactoryApi.ts

import { Web3Provider, ExternalProvider } from '@ethersproject/providers';
import { Contract, utils } from 'ethers';

import ContractApi from 'controllers/chain/ethereum/contractApi';

export default class DaoFactoryApi implements ContractApi<Contract> {
    public readonly gasLimit: number = 3000000;

    public readonly contractAddress: string;
    public readonly DAOFactoryABI: [];
    private _Contract: Contract;
    public get Contract() { return this._Contract; }
    public readonly Provider: Web3Provider;

    constructor(
        contractAddress: string,
        web3Provider: ExternalProvider
    ) {
        this.contractAddress = contractAddress;
        this.Provider = new Web3Provider(web3Provider);
        // 12s minute polling interval (default is 4s)
        this.Provider.pollingInterval = 12000;
    }

    public async init(tokenName: string) {
        try {
            DAOFactoryABI = getContractAbi(this.contractAddress);
        } catch (error) {
            console.error(`Could not fetch abi from contract ${this.contractAddress}: ${error.message}`);
        }

        this._Contract = new Contract(this.contractAddress, DAOFactoryABI, this.Provider);

        // attempt to query token via a provided function call name
        try {
            // Instead of this ABI use, DAOFactoryABI which gets retrieved from DB
            const ABI = [
                {
                'inputs': [],
                'name': tokenName,
                'outputs': [
                    {
                    'name': '',
                    'type': 'address'
                    }
                ],
                'stateMutability': 'view',
                'type': 'function'
                }
            ];
            const iface = new utils.Interface(JSON.stringify(ABI));
            const data = iface.encodeFunctionData(tokenName);
            const resultData = await this.Contract.provider.call({ to: this.Contract.address, data });
            // tokenAddress = utils.getAddress(Buffer.from(utils.stripZeros(resultData)).toString('hex'));
        } catch (err) {
            console.error(`Could not fetch token ${tokenName}: ${err.message}`);
        }

    }
}
