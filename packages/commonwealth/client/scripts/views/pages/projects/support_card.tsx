/* @jsx m */

import 'pages/projects/support_card.scss';

import m from 'mithril';
import ClassComponent from 'class_component';

import _ from 'lodash';
import { CWText } from 'views/components/component_kit/cw_text';
import { Project } from 'models';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import app from 'state';
import { BigNumber } from 'ethers';
import { ValidationStatus } from '../../components/component_kit/cw_validation_text';
import { ProjectRole } from './types';
import { CWAvatar } from '../../components/component_kit/cw_avatar';
import { CWTokenInput } from '../../components/component_kit/cw_token_input';

// eslint-disable-next-line max-len
const WethUrl =
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png';

type SupportCardAttrs = {
  project: Project;
  supportType: ProjectRole;
};

const validateSupportAmount = (value: string): [ValidationStatus, string] => {
  if (Number.isNaN(+value)) return ['failure', 'Invalid number'];
  return ['success', 'Valid amount'];
};

export default class SupportCard extends ClassComponent<SupportCardAttrs> {
  private amount: string;

  async hasAcceptedTokenAllowance(
    projectId: string,
    address: string
  ): Promise<boolean> {
    const allowance = await app.projects.getUserERC20TokenAllowance(
      projectId,
      address
    );
    return BigNumber.from(allowance).gt(0);
  }

  view(vnode: m.Vnode<SupportCardAttrs>) {
    const { project, supportType } = vnode.attrs;

    const isTokenApproved = this.hasAcceptedTokenAllowance(
      project.id,
      project.token
    );

    let headerText: string;
    let buttonLabel: string;
    let inputLabel: string;
    if (supportType === ProjectRole.Backer) {
      headerText = 'Back This Project';
      buttonLabel = 'Back This Project';
      inputLabel = 'Enter Amount To Back';
      onclick = () => app.projects.back(project.id, this.amount);
    } else if (supportType === ProjectRole.Curator) {
      headerText = 'Be A Curator';
      buttonLabel = 'Curate This Project';
      inputLabel = 'Enter Amount To Curate';
      onclick = () => app.projects.curate(project.id, this.amount);
    } else {
      return;
    }

    return (
      <div class="SupportCard">
        <div class="card-header">
          <CWIcon iconName={supportType} iconSize="large" />
          <CWText type="h3" weight="semiBold">
            {headerText}
          </CWText>
        </div>
        <div class="card-body">
          <CWText type="caption">
            {supportType === ProjectRole.Backer
              ? ''
              : `Curator receives ${project.curatorFee}% of funds`}
          </CWText>
          <CWTokenInput
            label={inputLabel}
            inputValidationFn={validateSupportAmount}
            oninput={(e) => {
              this.amount = e.target.value;
            }}
            tokenIconUrl={WethUrl}
          />
          {isTokenApproved ? (
            <CWButton label={buttonLabel} onclick={onclick} />
          ) : (
            <CWButton
              label={'Approve'}
              onclick={() => {
                app.projects.approveToken(project.id, project.token);
                m.redraw();
              }}
            />
          )}
        </div>
      </div>
    );
  }
}
