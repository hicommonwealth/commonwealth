/* @jsx m */
import 'pages/projects/create_project_form.scss';

import m from 'mithril';

import app from 'state';
import { QuillEditor } from 'views/components/quill/quill_editor';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { ButtonGroup, Button, SelectList, Icons } from 'construct-ui';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { notifyError } from 'controllers/app/notifications';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import Sublayout from 'views/sublayout';
import { ChainBase } from 'common-common/src/types';
import Web3 from 'web3';
import CoverImageUpload from './cover_image_upload';

const weekInSeconds = 604800;
const nowInSeconds = new Date().getTime() / 1000;

// @Zak and @Gabe for PR review: Thoughts on this validation system, and documenting/standardizing?
// See logic in create_project_form inputValidationFn (on each text input) + final 'submit' button functionality,
// especially in conjunction with new `oninput` attr
export const validateProjectForm = (property: string, value: string) => {
  console.log(property, value);
  if (!value)
    return [
      'failure',
      `Form is missing a ${property.split(/(?=[A-Z])/)} input.`,
    ];
  let errorMessage: string;
  switch (property) {
    case 'title':
      if (value.length < 8 || value.length > 64) {
        errorMessage = `Title must be valid string between 3 and 64 characters. Current count: ${value.length}`;
      }
      break;
    case 'shortDescription':
      if (value.length > 224) {
        errorMessage = `Input limit is 224 characters. Current count: ${value.length}`;
      }
      break;
    case 'token':
    case 'beneficiary':
    case 'creator':
      if (!Web3.utils.isAddress(value)) {
        errorMessage = `Invalid ${property} address. Must be a valid Ethereum address.`;
      }
      break;
    case 'fundraiseLength':
      // TODO: Min fundraiseLength check
      if (Number.isNaN(+value)) {
        errorMessage = 'Invalid fundraise length. Must be between [X, Y]';
      }
      break;
    case 'threshold':
      // TODO: Min threshold check
      if (Number.isNaN(+value)) {
        errorMessage = 'Invalid threshold amount. Must be between [X, Y]';
      }
      break;
    case 'curatorFee':
      if (Number.isNaN(+value) || +value > 100 || +value < 0) {
        errorMessage = `Curator fee must be a valid number (%) between 0 and 100.`;
      }
      break;
    default:
      break;
  }

  if (errorMessage) {
    return ['failure', errorMessage];
  } else {
    return ['success', `Valid ${property}`];
  }
};

type TokenOption = {
  name: string;
  address: string;
};

export interface ICreateProjectForm {
  // Descriptive
  title: string;
  description: QuillEditor;
  shortDescription: string;
  coverImage: string;
  chainId: string;

  // Mechanical
  token: string;
  creator: string;
  beneficiary: string;
  threshold: number;
  fundraiseLength: number;
  curatorFee: number;
}

export class InformationSlide
  implements m.ClassComponent<{ form: ICreateProjectForm }>
{
  view(vnode: m.Vnode<{ form: ICreateProjectForm }>) {
    if (!vnode.attrs.form.creator) return;
    return (
      <div class="InformationSlide">
        <CWText type="h1">General Information</CWText>
        <CWText type="caption">
          Name your crowdfund, add a brief card description and upload a header
          image.
        </CWText>
        <CWTextInput
          placeholder="Your Project Name Here"
          label="Name Your Crowdfund"
          name="Name"
          oninput={(e) => {
            vnode.attrs.form.title = e.target.value;
          }}
          inputValidationFn={(val: string) => validateProjectForm('title', val)}
          value={vnode.attrs.form.title}
        />
        <CWTextInput
          value={vnode.attrs.form.creator}
          disabled={true}
          label="Creator Address (Switch active address to change)"
          name="Creator Address"
        />
        <CWTextArea
          placeholder="Write a short 2 or 3 sentence description of your project,"
          label="Short Description"
          name="Short Description"
          oninput={(e) => {
            vnode.attrs.form.shortDescription = e.target.value;
          }}
          inputValidationFn={(val: string) =>
            validateProjectForm('shortDescription', val)
          }
          value={vnode.attrs.form.shortDescription}
        />
        <CoverImageUpload
          uploadStartedCallback={() => {
            m.redraw();
          }}
          uploadCompleteCallback={(files) => {
            files.forEach((f) => {
              if (!f.uploadURL) return;
              const url = f.uploadURL.replace(/\?.*/, '');
              vnode.attrs.form.coverImage = url.trim();
            });
            m.redraw();
          }}
        />
      </div>
    );
  }
}

export class FundraisingSlide
  implements m.ClassComponent<{ form: ICreateProjectForm }>
{
  private tokenName = 'WETH';

  view(vnode: m.Vnode<{ form: ICreateProjectForm }>) {
    return (
      <div class="FundraisingSlide">
        <CWText type="h1">Fundraising and Length</CWText>
        <CWText type="caption">
          Select what token type, your goal funding goal and period as well as
          what address the funds will be going.
        </CWText>
        <SelectList
          items={[
            {
              name: 'WETH',
              address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            },
            {
              name: 'DAI',
              address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            },
            {
              name: 'USDC',
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            },
            {
              name: 'RAI',
              address: '0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919',
            },
          ]}
          itemRender={(token: TokenOption) => {
            return (
              <div value={token.address} style="cursor: pointer">
                <CWText type="body1">{token.name}</CWText>
              </div>
            );
          }}
          filterable={false}
          label="Raise In"
          name="Raise In"
          onSelect={(token: TokenOption) => {
            this.tokenName = token.name;
            vnode.attrs.form.token = token.address;
          }}
          style="width: 441px;"
          trigger={
            <Button
              align="left"
              compact={true}
              iconRight={Icons.CHEVRON_DOWN}
              style="width: 100%;"
              label={`Raise token: ${this.tokenName}`}
            />
          }
        />
        <CWTextInput
          label="Goal"
          name="Goal"
          inputValidationFn={(val: string) =>
            validateProjectForm('threshold', val)
          }
          oninput={(e) => {
            vnode.attrs.form.threshold = e.target.value;
          }}
          value={vnode.attrs.form.threshold}
        />
        <SelectList
          items={['1 week', '2 weeks', '3 weeks', '4 weeks']}
          itemRender={(i: string) => {
            return (
              <div value={i} style="cursor: pointer">
                <CWText type="body1">{i}</CWText>
              </div>
            );
          }}
          filterable={false}
          label="Fundraising Period"
          name="Fundraising Period"
          onSelect={(length: string) => {
            const lengthInSeconds = +length.split(' ')[0] * weekInSeconds;
            vnode.attrs.form.fundraiseLength = lengthInSeconds;
          }}
          style="width: 441px;"
          trigger={
            <Button
              align="left"
              compact={true}
              iconRight={Icons.CHEVRON_DOWN}
              style="width: 100%;"
              label={`Fundraise period: ${
                vnode.attrs.form?.fundraiseLength / weekInSeconds
              } week`}
            />
          }
        />
        <CWTextInput
          placeholder="Address"
          label="Beneficiary Address"
          name="Beneficiary Address"
          inputValidationFn={(val: string) =>
            validateProjectForm('beneficiary', val)
          }
          oninput={(e) => {
            vnode.attrs.form.beneficiary = e.target.value;
          }}
          value={vnode.attrs.form.beneficiary}
        />
        <CWTextInput
          placeholder="Set Quantity"
          label="Curator Fee (%)"
          name="Curator Fee"
          oninput={(e) => {
            vnode.attrs.form.curatorFee = e.target.value;
          }}
          inputValidationFn={(val: string) =>
            validateProjectForm('curatorFee', val)
          }
          value={vnode.attrs.form.curatorFee}
        />
      </div>
    );
  }
}

export class DescriptionSlide
  implements m.ClassComponent<{ form: ICreateProjectForm }>
{
  view(vnode: m.Vnode<{ form: ICreateProjectForm }>) {
    return (
      <div class="DescriptionSlide">
        <CWText type="h1">General Information</CWText>
        <CWText type="caption">
          Add any content you feel would aid in describing your project.
        </CWText>
        <QuillEditorComponent
          oncreateBind={(state: QuillEditor) => {
            vnode.attrs.form.description = state;
          }}
          editorNamespace="project-description"
          mode="richText"
          placeholder="Write a full-length description of your project proposal,"
        />
      </div>
    );
  }
}

export default class CreateProjectForm implements m.ClassComponent {
  private form: ICreateProjectForm;
  private stage: 'information' | 'fundraising' | 'description';

  view(vnode) {
    // Because we are switching to new chain, activeAccount may not be set
    if (!app.user?.activeAccount && app.isLoggedIn()) {
      return;
    }
    // Create project form must be scoped to an Ethereum page
    if (app.user.activeAccount.chainBase !== ChainBase.Ethereum) {
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
          {m(
            ButtonGroup,
            {
              class: 'NavigationButtons',
              outlined: true,
            },
            [
              m(Button, {
                disabled: this.stage === 'information',
                label: [
                  m(CWIcon, { iconName: 'arrowLeft' }),
                  m('span', 'Previous Page'),
                ],
                onclick: (e) => {
                  e.preventDefault();
                  if (this.stage === 'fundraising') {
                    this.stage = 'information';
                  } else if (this.stage === 'description') {
                    this.stage = 'fundraising';
                  }
                },
              }),
              this.stage !== 'description' &&
                m(Button, {
                  label: [
                    m('span', 'Next Page'),
                    m(CWIcon, { iconName: 'arrowRight' }),
                  ],
                  onclick: (e) => {
                    e.preventDefault();
                    if (this.stage === 'information') {
                      this.stage = 'fundraising';
                    } else if (this.stage === 'fundraising') {
                      this.stage = 'description';
                    }
                  },
                }),
              this.stage === 'description' &&
                m(Button, {
                  label: 'Submit',
                  onclick: async (e) => {
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
                  },
                }),
            ]
          )}
        </div>
      </Sublayout>
    );
  }
}
