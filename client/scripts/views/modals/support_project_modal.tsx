/* eslint-disable max-len */
import { Project } from 'models';
import { BN } from 'ethereumjs-util/node_modules/@types/bn.js';
import m from 'mithril';
import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';

const supportProjectModalCopy = {
  curate: {
    sidebar: {
      header: 'Become A Curator',
      body: 'To curate is stake in support of the project with actively donating. Your funds will NOT be used for backing the project but you will be entitled to a percent of the project’s Curator Fee.',
    },
    body: {
      header: 'How Much Do You Want to Curate?',
      buttonText: 'Curate This Project',
      buttonLabel: 'Enter Amount to Curate',
    },
  },
  back: {
    sidebar: {
      header: 'Back This Project',
      body: 'To back is supporting with funds pending the success fo the project. If the project is successful, you will recieve what the project author erfe. If the project is not successful, your funds will be returned.',
    },
    body: {
      header: 'How Much Do You Want to Back?',
      buttonLabel: 'Enter Amount to Back',
      buttonText: 'Back This Project',
    },
  },
};

export class SupportProjectModal
  implements
    m.ClassComponent<{ project: Project; supportType: 'curate' | 'back' }>
{
  private amount;

  private _onSubmit(projectId, supportType: 'curate' | 'back', e: Event) {
    if (supportType === 'curate') {
      app.projects
        .curate(projectId, this.amount)
        .then(() => $(e.target).trigger('modalexit'));
    } else if (supportType === 'back') {
      app.projects
        .back(projectId, this.amount)
        .then(() => $(e.target).trigger('modalexit'));
    }
  }

  view(vnode) {
    const { project, supportType } = vnode.attrs;
    const copyText = supportProjectModalCopy[supportType];
    return (
      <div class="SupportProjectModal">
        <div class={`sidebar ${supportType}`}>
          <div class="sidebar-content">
            <CWText type="h4" fontWeight="semiBold" className="header-text">
              {copyText.sidebar.header}
            </CWText>
            <CWText type="b2">{copyText.sidebar.body}</CWText>
          </div>
        </div>
        <div class="body">
          <div class="body-content">
            <div class="header-container">
              <CWText type="h3" fontWeight="semiBold" className="header-text">
                {copyText.body.header}
              </CWText>
            </div>
            {/* TODO Input validation fn */}
            <CWTextInput
              label={copyText.body.buttonLabel}
              placeholder="0.00"
              oninput={(e) => this.amount === e.target.value.length}
            />
            <div class="buttons-row">
              <CWButton label="Nevermind" buttonType="secondary" />
              <CWButton
                label={copyText.body.buttonText}
                onclick={(e) => this._onSubmit(project.id, supportType, e)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
