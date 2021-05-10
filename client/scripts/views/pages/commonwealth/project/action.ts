import 'pages/commonwealth/projects.scss';

import { Input, TextArea, Form, FormLabel, FormGroup, Button, Grid, Col, Checkbox } from 'construct-ui';
import m from 'mithril';
import app from 'state';

import { CWProjectWithParticipants } from 'views/components/project_card';

const InProgressActionModule: m.Component<{callback: (isBack: boolean) => void}, {}> = {
  view: (vnode) => {
    const { callback } = vnode.attrs;
    return [
      m(Button, {
        class: 'contribute-button',
        label: 'Back with',
        rounded: true,
        fluid: true,
        intent: 'primary',
        onclick: (e) => { callback(true); }
      }),
      m(Button, {
        class: 'contribute-button',
        label: 'Curate to receive success',
        rounded: true,
        fluid: true,
        intent: 'primary',
        onclick: (e) => { callback(false); }
      }),
    ];
  }
}

const SuccsedActionModule: m.Component<{callback: (isRedeem: boolean) => void, isBeneficiary: boolean}, {}> = {
  view: (vnode) => {
    const { callback, isBeneficiary } = vnode.attrs;
    return [
      m(Button, {
        class: 'contribute-button',
        label: 'Redeem CToken',
        rounded: true,
        fluid: true,
        intent: 'primary',
        onclick: (e) => { callback(true); }
      }),
      m(Button, {
        class: 'contribute-button',
        label: 'Withdraw',
        disabled: !isBeneficiary,
        rounded: true,
        fluid: true,
        intent: 'primary',
        onclick: (e) => { callback(true); }
      }),
    ];
  }
}

const FailedActionModule: m.Component<{callback: () => void}, {}> = {
  view: (vnode) => {
    const { callback } = vnode.attrs;
    return [
      m(Button, {
        class: 'contribute-button',
        label: 'Redeem BTokens',
        rounded: true,
        fluid: true,
        intent: 'primary',
        onclick: callback
      }),
    ];
  }
}

const ActionPage: m.Component<{project: CWProjectWithParticipants, protocol: any}, {amount: any, error: string}> = {
  oncreate: (vnode) => {
    vnode.state.error = '';
    vnode.state.amount = 0;
  },
  view: (vnode) => {
    const { project, protocol } = vnode.attrs;
    let percent = (100 * (project.totalFunding / project.threshold)).toFixed(1);
    if (parseInt(percent) > 100) {
      percent = '100';
    }

    const { address } = app.user.activeAccount;

    return m('.col-lg-4 .action-area', [
      m('.action-title', [
        m('span.amount', `${project.totalFunding} / ${project.threshold} `),
        m('span.coin', project.acceptedToken === '0x01' ? 'Ether' : 'ERC20 Token')
      ]),
      m('.project-progress', [
        m('.project-progress-bar', [
          m('.project-progress-bar-fill', {
            style: `width: ${percent}%`
          }),
        ]),
      ]),
      m('.project-funding-action', [
        m(FormGroup, [
          m(Input, {
            style: {
              width: '100%'
            },
            options: {
              name: 'name',
              placeholder: 'Enter the amount in ETH',
              autofocus: true,
            },
            oninput: (e) => {
              vnode.state.error = '';
              const result = (e.target as any).value;
              vnode.state.amount = result;
              // vnode.state.amount = app.chain.chain.coins(parseFloat(result), true);
            },
          }),
        ]),
        vnode.state.error && vnode.state.error !== '' && m('p.error', vnode.state.error),
        project.status === 'In Progress' && m(InProgressActionModule, {
          callback: async(isBacker) => {
            if (!vnode.state.amount || vnode.state.amount === 0) {
              vnode.state.error = 'Please enter the amount';
            } else if (isBacker) {
              // do back logic
              await protocol.backProject(address, parseInt(vnode.state.amount), project.projectHash);
            } else {
              // do curate logic
              await protocol.curateProject(address, parseInt(vnode.state.amount), project.projectHash);
            }
            m.redraw();
          }
        }),
        project.status === 'Successed' && m(SuccsedActionModule, {
          isBeneficiary: address === project.beneficiary,
          callback: async(isBacker) => {
            if (!vnode.state.amount || vnode.state.amount === 0) {
              vnode.state.error = 'Please enter the amount';
            } else if (isBacker) {
              // redeem CToken logic
              await protocol.redeemCToken(address, parseInt(vnode.state.amount), project.projectHash);
            } else {
              // withdraw logic
              await protocol.withdraw(project.projectHash);
            }
            m.redraw();
          }
        }),
        project.status === 'Failed' && m(FailedActionModule, { callback: async() => {
          if (!vnode.state.amount || vnode.state.amount === 0) {
            vnode.state.error = 'Please enter the amount';
          } else {
            // redeemCToken logic
            await protocol.redeemCToken(address, parseInt(vnode.state.amount), project.projectHash);
          }
          m.redraw();
        } }),
        m(Button, {
          class: 'contribute-button',
          disabled: true,
          label: 'Go to discussion thread ->',
          rounded: true,
          fluid: true,
          // intent: 'primary',
          onclick: (e) => {
            // TODO
          }
        }),
      ]),
      
    ]);
  }
}


export default ActionPage;