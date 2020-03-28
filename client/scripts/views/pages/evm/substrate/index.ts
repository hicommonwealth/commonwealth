import 'pages/council.scss';

import _ from 'lodash';
import m from 'mithril';

import app, { ApiStatus } from 'state';
import ListingPage from 'views/pages/_listing_page';
import PageLoading from 'views/pages/loading';


interface ISubstrateEVMState {
  bytecode: any;
  initialBalance: Number;
  gasLimit: Number;
  gasPrice: Number;
}

const SubstrateEVMContent: m.Component<{}, ISubstrateEVMState> = {
  oncreate: (vnode) => {
    vnode.state.bytecode = 0x0;
    vnode.state.initialBalance = 0;
    vnode.state.gasLimit = 0;
    vnode.state.gasPrice = 0;
  },
  view: (vnode) => {
    return [];
  },
};

export default SubstrateEVMContent;
