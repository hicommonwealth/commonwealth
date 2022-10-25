/* @jsx m */
import 'pages/projects/create_project_form.scss';

import m from 'mithril';
import app from 'state';

import { CWText } from 'views/components/component_kit/cw_text';
import { ButtonGroup, Button } from 'construct-ui';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { notifyError } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import { ChainBase } from 'common-common/src/types';
import { validateProjectForm } from '../helpers';
import { ICreateProjectForm, weekInSeconds, nowInSeconds } from '../types';

export default class CreateProjectForm implements m.ClassComponent {
  private form: ICreateProjectForm;
  private stage: 'information' | 'fundraising' | 'description';
  private $form: HTMLFormElement;

  onupdate() {
    this.$form = document.getElementsByTagName('form')[0];
  }

  view() {
    // Because we are switching to new chain, activeAccount may not be set
    if (!app.user?.activeAccount && app.isLoggedIn()) {
      return;
    }
    // Create project form must be scoped to an Ethereum page
    if (app.user.activeAccount.chain.base !== ChainBase.Ethereum) {
      m.route.set(`/projects/explore`);
    }

    if (!this.stage) {
      this.stage = 'information';
    }
    if (!this.form) {
      this.form = {
        title: null,
        // WETH hard-coded as default raise token, but can be overwritten
        token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        creator: null,
        beneficiary: null,
        description: null,
        shortDescription: null,
        coverImage: null,
        curatorFee: null,
        threshold: null,
        fundraiseLength: weekInSeconds,
        chainId: app.activeChainId(),
      };
    }
    if (!this.form.creator && app.user.activeAccount?.address) {
      this.form.creator = app.user.activeAccount.address;
    }

    return (
      <Sublayout
        title="Create project"
        hideSearch={true}
        hideSidebar={true}
        showNewProposalButton={false}
        alwaysShowTitle={true}
      >
        <div class="CreateProjectForm">
          <div class="form-panel">
            <CWText type="h5" weight="medium">
              Project Creation
            </CWText>
            {this.stage === 'information' && (
              <InformationSlide form={this.form} />
            )}
            {this.stage === 'fundraising' && (
              <FundraisingSlide form={this.form} />
            )}
            {this.stage === 'description' && (
              <DescriptionSlide form={this.form} />
            )}
          </div>
          <ButtonGroup class="NavigationButtons" outlined={true}>
            <Button
              disabled={this.stage === 'information'}
              label={
                <>
                  <CWIcon iconName="arrowLeft" />
                  <span>'Previous Page'</span>
                </>
              }
              onclick={(e) => {
                e.preventDefault();
                if (this.stage === 'fundraising') {
                  this.stage = 'information';
                } else if (this.stage === 'description') {
                  this.stage = 'fundraising';
                }
              }}
            />
            {this.stage !== 'description' && (
              <Button
                label={
                  <>
                    <span>'Next Page'</span>
                    <CWIcon iconName="arrowRight" />
                  </>
                }
                onclick={(e) => {
                  e.preventDefault();
                  this.$form.reportValidity();
                  return;
                  if (this.stage === 'information') {
                    this.stage = 'fundraising';
                  } else if (this.stage === 'fundraising') {
                    this.stage = 'description';
                  }
                }}
              />
            )}
            {this.stage === 'description' && (
              <Button
                label="Submit"
                onclick={async (e) => {
                  e.preventDefault();
                  console.log(this.form);
                  for (const property in this.form) {
                    if ({}.hasOwnProperty.call(this.form, property)) {
                      const [state, errorMessage] = validateProjectForm(
                        property,
                        this.form[property]
                      );
                      if (state !== 'success') {
                        notifyError(errorMessage);
                        return;
                      }
                    }
                  }
                  const [txReceipt, newProjectId] =
                    await app.projects.createProject({
                      title: this.form.title,
                      description: this.form.description.textContentsAsString,
                      shortDescription: this.form.shortDescription,
                      coverImage: this.form.coverImage,
                      chainId: app.activeChainId(),
                      token: this.form.token,
                      creator: this.form.creator,
                      beneficiary: this.form.beneficiary,
                      threshold: this.form.threshold,
                      deadline: nowInSeconds + this.form.fundraiseLength,
                      curatorFee: Math.round(this.form.curatorFee * 100), // curator fee is between 0 & 10000
                    });
                  if (txReceipt.status !== 1) {
                    notifyError('Project creation failed');
                  } else {
                    m.route.set(`/project/${newProjectId}`);
                  }
                }}
              />
            )}
          </ButtonGroup>
        </div>
      </Sublayout>
    );
  }
}
