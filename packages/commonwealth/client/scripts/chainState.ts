import { IChainAdapter } from 'models';

export interface IChainAppState {
  chain: IChainAdapter<any, any>;
}

const chainState: IChainAppState = {
  chain: null,
};

export default chainState;

