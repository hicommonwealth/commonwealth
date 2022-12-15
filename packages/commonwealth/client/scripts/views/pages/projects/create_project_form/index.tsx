/* @jsx m */
import 'pages/projects/create_project_form.scss';

import m from 'mithril';
import app from 'state';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { notifyError } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import { tokensToWei, weiToTokens } from 'helpers';
import { ChainBase } from 'common-common/src/types';
import { CWButton } from 'views/components/component_kit/cw_button';
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
        // WETH hard-coded as default raise token until we diversify in future versions
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
    console.log({
      title: this.form.title,
      description: this.form.description.textContentsAsString,
      shortDescription: this.form.shortDescription,
      coverImage: this.form.coverImage,
      chainId: app.activeChainId(),
      token: this.form.token,
      creator: this.form.creator,
      beneficiary: this.form.beneficiary,
      threshold: this.form.threshold,
      deadline: Math.round(nowInSeconds + this.form.fundraiseLength),
      curatorFee: Math.round(this.form.curatorFee),
    });
    const [txReceipt, newProjectId] = await app.projects.create({
      title: this.form.title,
      description: this.form.description.textContentsAsString,
      shortDescription: this.form.shortDescription,
      coverImage: this.form.coverImage,
      chainId: app.activeChainId(),
      token: this.form.token,
      creator: this.form.creator,
      beneficiary: this.form.beneficiary,
      threshold: weiToTokens(this.form.threshold.toString(), 18),
      deadline: Math.round(nowInSeconds + this.form.fundraiseLength),
      curatorFee: Math.round(this.form.curatorFee),
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
          <CWButton
            disabled={!app.isLoggedIn()}
            label="Create Project (Jake Test)"
            onclick={async () => {
              console.log('Creating a project with the following values:');
              console.log({
                title: 'Test title',
                description: 'Long description',
                shortDescription: 'Short description',
                coverImage: 'https://www.mycoolimageurl.com',
                chainId: 'dydx',
                token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                creator: app.user.activeAccounts[0].address,
                beneficiary: app.user.activeAccounts[0].address,
                threshold: tokensToWei('3', 18),
                deadline: Math.round(nowInSeconds + weekInSeconds),
                curatorFee: Math.round(30),
              });
              const [txReceipt, newProjectId] = await app.projects.create({
                title: 'Test title',
                description: 'Long description',
                shortDescription: 'Short description',
                coverImage: 'https://www.mycoolimageurl.com',
                chainId: 'dydx',
                token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                creator: app.user.activeAccounts[0].address,
                beneficiary: app.user.activeAccounts[0].address,
                threshold: tokensToWei('3', 18),
                deadline: Math.round(nowInSeconds + weekInSeconds),
                curatorFee: Math.round(30),
              });
              console.log({ txReceipt, newProjectId });
            }}
          />
          <div class="form-panel">
            <CWText type="h5" weight="medium">
              Project Creation
            </CWText>
            <FormSlide form={this.form} />
          </div>
          <CWButton
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
            <CWButton
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
            <CWButton
              label="Submit"
              onclick={async (e) => {
                console.log(this.form);
                this.submitForm();
              }}
            />
          )}
        </div>
      </Sublayout>
    );
  }
}
