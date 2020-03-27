import 'pages/council.scss';

import _ from 'lodash';
import m from 'mithril';

import app, { ApiStatus } from 'state';
import ListingPage from 'views/pages/_listing_page';
import PageLoading from 'views/pages/loading';

interface IEVMAttrs {
  bytecode: any;
  initialBalance: Number;
  gasLimit: Number;
  gasPrice: Number;
}

interface IEVMState {
  bytecode: any;
  initialBalance: Number;
  gasLimit: Number;
  gasPrice: Number;
}

const EVMPage: m.Component<IEVMAttrs, IEVMState> = {
  oncreate: (vnode) => {
    vnode.state.bytecode = (vnode.attrs.bytecode) ? vnode.attrs.bytecode : 0x0;
    vnode.state.initialBalance = (vnode.attrs.initialBalance) ? vnode.attrs.initialBalance : 0;
    vnode.state.gasLimit = (vnode.attrs.gasLimit) ? vnode.attrs.gasLimit : 0;
    vnode.state.gasPrice = (vnode.attrs.gasPrice) ? vnode.attrs.gasPrice : 0;
  },
  view: (vnode) => {
    return [];
  },
};

export default EVMPage;
