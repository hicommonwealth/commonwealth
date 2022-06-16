/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import app from 'state';
import QuillEditor from 'views/components/quill_editor';
import Dropzone from 'dropzone';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { ButtonGroup, Button, SelectList, Icons } from 'construct-ui';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { notifyError } from 'controllers/app/notifications';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';

const weekInSeconds = 604800;
const nowInSeconds = new Date().getTime() / 1000;

type TokenOption = {
  name: string;
  address: string;
};

interface ICreateProjectForm {
  // Descriptive
  title: string;
  description: string;
  shortDescription: string;
  coverImage: string;
  chainId: string;

  // Mechanical
  token: string;
  creator: string;
  beneficiary: string;
  threshold: number;
  fundraiseLength: number;
  deadline: number;
  curatorFee: number;

  // IPFS
  ipfsContent: string;
}

interface ICoverImageUploadAttrs {
  form: ICreateProjectForm;
  uploadStartedCallback?: CallableFunction;
  uploadCompleteCallback?: CallableFunction;
}

const validateTitle = (title: string) => {
  if (!title) return false;
  if (title.length < 3 || title.length > 64) return false;
  return true;
};

const validateShortDescription = (description: string) => {
  if (!description) return false;
  if (description.length > 224) return false;
  return true;
};

const validateDescription = (description: string) => {
  if (!description) return false;
  return true;
};
const validateToken = (token: string) => {
  if (!token) return false;
  // TODO: Valid address check
  return true;
};
const validateBeneficiary = (beneficiary: string) => {
  if (!beneficiary) return false;
  // TODO: Valid address check
  return true;
};
const validateCreator = (creator: string) => {
  if (!creator) return false;
  // TODO: Valid address check
  return true;
};
const validateFundraiseLength = (length: number) => {
  if (!length) return false;
  if (Number.isNaN(length)) return false;
  // TODO: Min fundraiseLength check
  return true;
};
const validateCuratorFee = (fee: number) => {
  if (!fee) return false;
  if (Number.isNaN(fee)) return false;
  return true;
};
const validateThreshold = (threshold: number) => {
  if (!threshold) return false;
  if (Number.isNaN(threshold)) return false;
  // TODO: Min threshold check
  return true;
};

// TODO: Synchronize with new Avatar component
class CoverImageUpload implements m.ClassComponent<ICoverImageUploadAttrs> {
  private dropzone?: any;
  private uploaded: boolean;

  oncreate(vnode: m.VnodeDOM<ICoverImageUploadAttrs>) {
    $(vnode.dom).on('cleardropzone', () => {
      this.dropzone.files.map((file) => this.dropzone.removeFile(file));
    });
    this.dropzone = new Dropzone(vnode.dom, {
      // configuration for textarea dropzone
      clickable: '.AvatarUpload .attach-button',
      previewsContainer: '.AvatarUpload .dropzone-previews',
      // configuration for direct upload to s3
      url: '/', // overwritten when we get the target URL back from s3
      header: '',
      method: 'put',
      parallelUploads: 1,
      uploadMultiple: false,
      autoProcessQueue: false,
      maxFiles: 1,
      maxFilesize: 10, // MB
      // request a signed upload URL when a file is accepted from the user
      accept: (file, done) => {
        // TODO: Change to POST /uploadSignature
        // TODO: Reuse code as this is used in other places
        $.post(`${app.serverUrl()}/getUploadSignature`, {
          name: file.name, // tokyo.png
          mimetype: file.type, // image/png
          auth: true,
          jwt: app.user.jwt,
        })
          .then((response) => {
            if (response.status !== 'Success') {
              return done(
                'Failed to get an S3 signed upload URL',
                response.error
              );
            }
            file.uploadURL = response.result;
            this.uploaded = true;
            done();
            setTimeout(() => this.dropzone.processFile(file));
          })
          .catch((err: any) => {
            done(
              'Failed to get an S3 signed upload URL',
              err.responseJSON ? err.responseJSON.error : err.responseText
            );
          });
      },
      sending: (file, xhr) => {
        const _send = xhr.send;
        xhr.send = () => {
          _send.call(xhr, file);
        };
      },
    });
    this.dropzone.on('processing', (file) => {
      this.dropzone.options.url = file.uploadURL;
      if (vnode.attrs.uploadStartedCallback) {
        vnode.attrs.uploadStartedCallback();
      }
    });
    this.dropzone.on('complete', (file) => {
      if (vnode.attrs.uploadCompleteCallback) {
        vnode.attrs.uploadCompleteCallback(this.dropzone.files);
      }
    });
  }

  view(vnode: m.Vnode<ICoverImageUploadAttrs>) {
    const logoURL = this.dropzone?.option?.url || app.chain?.meta.iconUrl;
    return (
      <div class="CoverImageUpload">
        <div
          class={`dropzone-attach ${this.uploaded ? 'hidden' : ''}`}
          style={`background-image: url(${logoURL}); background-size: 92px;`}
        >
          <div class="attach-button">
            <CWIcon iconName="plus" iconSize="small" />
          </div>
        </div>
        <div class={`dropzone-previews ${this.uploaded ? 'hidden' : ''}`}></div>
      </div>
    );
  }
}

export class InformationSlide
  implements m.ClassComponent<{ form: ICreateProjectForm }>
{
  view(vnode: m.Vnode<{ form: ICreateProjectForm }>) {
    return (
      <div class="InformationSlide">
        <CWText type="h1">General Information</CWText>
        <CWText type="caption">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. iaculis donec
          sapien maecenas vel nisl faucibus ultricies.
        </CWText>
        <CWTextInput
          placeholder="Your Project Name Here"
          label="Name Your Crowdfund"
          name="Name"
          oninput={(e) => {
            console.log(e);
            vnode.attrs.form.title = e.target.value;
          }}
          inputValidationFn={(value) => {
            const isValid = validateTitle(value);
            if (!isValid) {
              return [
                'failure',
                `Name must be between 8-64 characters. Current count: ${value.length}`,
              ];
            } else {
              return ['success', ''];
            }
          }}
        />
        {/* TODO: The below should be a textarea */}
        <CWTextArea
          placeholder="Write a short 2 or 3 sentence description of your project,"
          label="Short Description"
          name="Short Description"
          oninput={(e) => {
            vnode.attrs.form.shortDescription = e.target.value;
          }}
          inputValidationFn={(value) => {
            const isValid = validateShortDescription(value);
            if (!isValid) {
              return [
                'failure',
                `Input limit is 224 characters. Current count: ${value.length}`,
              ];
            } else {
              return ['success', ''];
            }
          }}
        />
        <CoverImageUpload />
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
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. iaculis donec
          sapien maecenas vel nisl faucibus ultricies.
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
          trigger={
            <Button
              align="left"
              compact={true}
              iconRight={Icons.CHEVRON_DOWN}
              style="width: 480px"
              label={`Raise token: ${this.tokenName}`}
            />
          }
        />
        <SelectList
          items={['1 week', '2 weeks', '3 weeks', '4 weeks']}
          itemRender={(i: string) => {
            console.log(i);
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
          trigger={
            <Button
              align="left"
              compact={true}
              iconRight={Icons.CHEVRON_DOWN}
              style="width: 480px"
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
          oninput={(e) => {
            // TODO: Address validation
            vnode.attrs.form.beneficiary = e.target.value;
          }}
        />
        <CWTextInput
          placeholder="Set Quantity"
          label="Curator Fee (%)"
          name="Curator Fee"
          oninput={(e) => {
            // Convert to 10000 to capture decimal points
            vnode.attrs.form.curatorFee = Math.round(e.target.value * 100);
            console.log(vnode.attrs.form.curatorFee);
          }}
          inputValidationFn={(value) => {
            const isNotNumber = Number.isNaN(+value);
            const isNotPercent = +value > 100 || +value < 0;
            if (isNotNumber || isNotPercent) {
              return [
                'failure',
                'Input must be valid percentage between 0 and 100',
              ];
            } else {
              return ['success', ''];
            }
          }}
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
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. iaculis donec
          sapien maecenas vel nisl faucibus ultricies.
        </CWText>
        {m(QuillEditor, {
          oncreateBind: (state) => {
            vnode.attrs.form.description = state;
          },
          editorNamespace: 'project-description',
          placeholder:
            'Write a full-length description of your project proposal,',
        })}
      </div>
    );
  }
}

export default class CreateProjectForm implements m.ClassComponent {
  private form: ICreateProjectForm;
  private stage: 'information' | 'fundraising' | 'description';
  oninit() {
    this.stage = 'information';
    this.form = {
      title: '',
      // WETH hard-coded as default raise token
      token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      creator: app.user.activeAccount.address,
      beneficiary: '',
      description: '',
      shortDescription: '',
      coverImage: '',
      curatorFee: 0,
      threshold: 0,
      fundraiseLength: weekInSeconds,
      deadline: nowInSeconds + weekInSeconds,
      chainId: app.activeChainId(),
      ipfsContent: null,
    };
  }
  view() {
    return (
      <div class="CreateProjectForm">
        <div class="left-sidebar"></div>
        <div class="right-panel">
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
            class: 'NotificationButtons',
            outlined: true,
          },
          [
            m(Button, {
              disabled: this.stage === 'information',
              label: 'Previous Page',
              onclick: (e) => {
                e.preventDefault();
                if (this.stage === 'fundraising') {
                  this.stage = 'information';
                } else if (this.stage === 'description') {
                  this.stage = 'fundraising';
                }
              },
            }),
            m(Button, {
              disabled: this.stage === 'description',
              label: 'Next Page',
              onclick: (e) => {
                e.preventDefault();
                if (this.stage === 'information') {
                  this.stage = 'fundraising';
                } else if (this.stage === 'fundraising') {
                  this.stage = 'description';
                }
              },
            }),
            m(Button, {
              disabled: this.stage !== 'description',
              label: 'Submit',
              onclick: (e) => {
                e.preventDefault();
                console.log(this.form);
                const {
                  title,
                  shortDescription,
                  description,
                  coverImage,
                  token,
                  threshold,
                  creator,
                  beneficiary,
                  fundraiseLength,
                  curatorFee,
                } = this.form;
                const isValidTitle = validateTitle(title);
                const isValidDescription = validateDescription(description);
                const isValidShortDescription =
                  validateShortDescription(shortDescription);
                const isValidCoverImage = coverImage?.length > 0;
                const isValidToken = validateToken(token);
                const isValidBeneficiary = validateBeneficiary(beneficiary);
                const isValidCreator = validateCreator(creator);
                const isValidFundraiseLength =
                  validateFundraiseLength(fundraiseLength);
                const isValidCuratorFee = validateCuratorFee(curatorFee);
                const isValidThreshold = validateThreshold(threshold);
                if (
                  !isValidTitle ||
                  !isValidDescription ||
                  !isValidShortDescription ||
                  !isValidCoverImage ||
                  !isValidToken ||
                  !isValidBeneficiary ||
                  !isValidCreator ||
                  !isValidCuratorFee ||
                  !isValidFundraiseLength ||
                  !isValidThreshold
                ) {
                  notifyError('Invalid form. Please check inputs.');
                }

                this.form.deadline = nowInSeconds + weekInSeconds;
                this.form.ipfsContent = JSON.stringify(this.form);
                if (!title || title.length)
                  app.projects.createProject(this.form);
              },
            }),
          ]
        )}
      </div>
    );
  }
}
