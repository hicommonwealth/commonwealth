import 'components/commonwealth/action_card.scss';

import { utils } from 'ethers';
import { Button } from 'construct-ui';
import m from 'mithril';

import app from 'state';
import { CWProject } from 'models/CWProtocol';

import InProgressActionCard from './inprogress_action';
import SuccsedActionCard from './successed_action';
import FailedActionCard from './failed_action';

const ActionCard: m.Component<{project: CWProject, protocol: any}, {amount: any, error: string, submitting: boolean}> = {
  oncreate: (vnode) => {
    vnode.state.error = '';
    vnode.state.amount = 0;
  },
  view: (vnode) => {
    const { project, protocol } = vnode.attrs;

    const threshold = utils.formatEther(project.threshold.asBN.toString());
    const totalFunding = utils.formatEther(project.totalFunding.asBN.toString());
    const acceptedTokenStr = project.totalFunding.denom;

    let percent = (100 * (parseFloat(totalFunding) / parseFloat(threshold))).toFixed(2);
    if (parseInt(percent) > 100) {
      percent = '100';
    }

    return m('.col-lg-4 .action-card', [
      m('.action-title', [
        m('span.amount', `${totalFunding} / ${threshold}`),
        m('span.coin', acceptedTokenStr)
      ]),
      m('.project-progress', [
        m('.project-progress-bar', [
          m('.project-progress-bar-fill', {
            style: `width: ${percent}%`
          }),
        ]),
      ]),
      project.status === 'In Progress' && m(InProgressActionCard, {
        project: project,
        protocol: protocol
      }),
      project.status === 'Successed' && m(SuccsedActionCard, {
        project: project,
        protocol: protocol
      }),
      project.status === 'Failed' && m(FailedActionCard, {
        project: project,
        protocol: protocol
      }),
      m(Button, {
        class: 'contribute-button',
        disabled: true,
        label: 'Go to discussion thread ->',
        rounded: true,
        fluid: true,
        // intent: 'primary',
        onclick: (e) => {}
      }),
    ]);
  }
}


export default ActionCard;