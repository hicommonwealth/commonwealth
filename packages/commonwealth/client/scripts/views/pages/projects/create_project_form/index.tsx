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
import {
  ICreateProjectForm,
  weekInSeconds,
  nowInSeconds,
  CreateProjectSlides,
  CreateProjectSlideNumber,
  CreateProjectKey,
} from '../types';
import { PageLoading } from '../../loading';

export default class CreateProjectForm implements m.ClassComponent {
  private form: ICreateProjectForm;
  private slideNumber: CreateProjectSlideNumber;
  private $form: HTMLFormElement;

  setStateData() {
    if (!this.slideNumber) {
      this.slideNumber = 1;
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
  }

  async submitForm() {
    const keys = Object.keys(this.form) as CreateProjectKey[];
    for (const key in keys) {
      if ({}.hasOwnProperty.call(this.form, key)) {
        const [state, errorMessage] = validateProjectForm(
          key as CreateProjectKey,
          this.form[key]
        );
        if (state !== 'success') {
          notifyError(errorMessage);
          return;
        }
      }
    }
    const [txReceipt, newProjectId] = await app.projects.createProject({
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
  }

  onupdate() {
    this.$form = document.getElementsByTagName('form')[0];
  }

  view() {
    if (!app?.activeChainId()) {
      return <PageLoading />;
    }

    // Project creation may only take place within Ethereum communities
    const isEthScoped =
      app.config.chains.getById(app.activeChainId()).base ===
      ChainBase.Ethereum;
    if (!app.isLoggedIn() || !isEthScoped) {
      m.route.set(`/projects/explore`);
    }

    this.setStateData();
    const FormSlide = CreateProjectSlides[this.slideNumber];

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
            <FormSlide form={this.form} />
          </div>
          <ButtonGroup class="NavigationButtons" outlined={true}>
            <Button
              disabled={this.slideNumber === 1}
              label={
                <>
                  <CWIcon iconName="arrowLeft" />
                  <span>Previous Page</span>
                </>
              }
              onclick={(e) => {
                this.slideNumber -= 1;
              }}
            />
            {this.slideNumber !== 3 ? (
              <Button
                label={
                  <>
                    <span>Next Page</span>
                    <CWIcon iconName="arrowRight" />
                  </>
                }
                onclick={(e) => {
                  const requiredInputsFilled = this.$form?.reportValidity();
                  if (requiredInputsFilled) {
                    this.slideNumber += 1;
                  }
                }}
              />
            ) : (
              <Button
                label="Submit"
                onclick={async (e) => {
                  console.log(this.form);
                  this.submitForm();
                }}
              />
            )}
          </ButtonGroup>
        </div>
      </Sublayout>
    );
  }
}
