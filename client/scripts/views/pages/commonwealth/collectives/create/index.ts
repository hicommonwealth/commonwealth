import m from 'mithril';

import 'pages/commonwealth/new.scss';

// import app from 'state';
// import PageLoading from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { kovanTokenData } from 'controllers/chain/ethereum/commonwealth/utils';
import FirstStepForm from './step1';
import SecondStepForm from './step2';

interface CollectiveDataType {
  creator: string;
  beneficiary: string;
  acceptedTokens: string[];
  strategies: string[];
  name: string;
  description: string;
  ipfsHash: string;
}

const NewCollectiveForm: m.Component<
  { callback; acceptedTokens; submitting },
  {
    step: number;
    collectiveData: CollectiveDataType;
    selectedTokens: string[];
  }
> = {
  oncreate: (vnode) => {
    vnode.state.step = 1;
    vnode.state.collectiveData = { acceptedTokens: [] } as CollectiveDataType;
    m.redraw();
  },
  view: (vnode) => {
    const { acceptedTokens } = vnode.attrs;

    // if (!app.user.activeAccount) return m('div', 'Must be logged in');
    // if (!acceptedTokens) return m('div', 'No accepted Tokens');
    // if (acceptedTokens.length === 0) return m('div', 'No accepted Tokens');
    // creator: app.user.activeAccount.address,

    if (vnode.state.step === 1) {
      return m(FirstStepForm, {
        callback: (cd: CollectiveDataType) => {
          vnode.state.collectiveData = cd;
          vnode.state.step = 2;
          vnode.state.selectedTokens = cd.acceptedTokens;
          m.redraw();
        },
        acceptedTokens: acceptedTokens || [],
      });
    }

    return m(SecondStepForm, {
      selectedTokens: vnode.state.selectedTokens || [],
      callback: (strategies: string[]) => {
        const newCollectiveData: CollectiveDataType = {
          creator: '', // app.user.activeAccount.address
          beneficiary: vnode.state.collectiveData.beneficiary,
          acceptedTokens: vnode.state.selectedTokens,
          strategies,
          name: vnode.state.collectiveData.name,
          description: vnode.state.collectiveData.description,
          ipfsHash: '',
        };
        vnode.attrs.callback(newCollectiveData);
      },
      submitting: vnode.attrs.submitting,
    });
  },
};

const NewCollectivePage: m.Component<
  undefined,
  {
    submitting: boolean;
    createError: string;
    acceptedTokens: any[];
    initialized: number;
    step: number;
  }
> = {
  oncreate: (vnode) => {
    vnode.state.step = 1;
    vnode.state.submitting = false;
    vnode.state.initialized = 1;
    vnode.state.acceptedTokens = kovanTokenData;
  },
  // onupdate: async (vnode) => {
  //   if (!protocolReady) return;
  //   if (vnode.state.initialized === 0) {
  //     vnode.state.acceptedTokens =
  //       await app.cmnProtocol.collective_protocol.getAcceptedTokens();
  //     vnode.state.initialized = 1;
  //     m.redraw();
  //   }
  // },
  view: (vnode) => {
    // if (vnode.state.initialized !== 1) return m(PageLoading);
    const { step, submitting, initialized, acceptedTokens } = vnode.state;

    return m(
      Sublayout,
      {
        class: 'NewProjectPage',
        title: 'Create a new Collective',
      },
      [
        m('.forum-container', [
          m(NewCollectiveForm, {
            callback: async (cd: CollectiveDataType) => {
              vnode.state.submitting = true;
              console.log(cd);
              vnode.state.submitting = false;
            },
            submitting: vnode.state.submitting,
            acceptedTokens: (acceptedTokens || []).map((token) => token.symbol),
          }),
          m('p.error-text', vnode.state.createError),
        ]),
      ]
    );
  },
};

export default NewCollectivePage;
