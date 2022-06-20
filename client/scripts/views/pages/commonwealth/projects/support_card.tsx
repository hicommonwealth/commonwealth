/* @jsx m */

import 'pages/projects/support_card.scss';

import m from 'mithril';
import _ from 'lodash';
import { CWText } from 'views/components/component_kit/cw_text';
import { Project } from 'models';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { ProjectRole } from './project_card';

// eslint-disable-next-line max-len
const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id sed nibh euismod mauris nunc. Est leo fringilla ultrices lectus leo. Et vel consequat blandit.`;

export default class SupportCard
  implements m.ClassComponent<{ project: Project; supportType: ProjectRole }>
{
  view(vnode: m.Vnode<{ project: Project; supportType: ProjectRole }>) {
    const { project, supportType } = vnode.attrs;

    let headerText: string;
    let buttonLabel: string;
    let inputLabel: string;
    if (supportType === ProjectRole.Backer) {
      headerText = 'Back This Project';
      buttonLabel = 'Back This Project';
      inputLabel = 'Enter Amount To Back';
    } else {
      headerText = 'Be A Curator';
      buttonLabel = 'Curate This Project';
      inputLabel = 'Enter Amount To Curate';
    }
    console.log({ headerText, buttonLabel, supportType });
    const onclick = () => null;
    return (
      <div class="SupportCard">
        <div class="card-header">
          <CWIcon iconName={supportType} iconSize="large" />
          <CWText type="h3" weight="semibold">
            {headerText}
          </CWText>
        </div>
        <div class="card-body">
          <CWText type="caption">{loremIpsum}</CWText>
          <CWTextInput label={inputLabel} placeholder="0.00" />
          <CWButton label={buttonLabel} onclick={onclick} />
        </div>
      </div>
    );
  }
}
