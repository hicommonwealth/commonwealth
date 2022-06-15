/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import app from 'state';
import QuillEditor from 'views/components/quill_editor';
import Dropzone from 'dropzone';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { ButtonGroup, Button, InputSelect } from 'construct-ui';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import validate from '@snapshot-labs/snapshot.js/dist/validations/basic';
import { notifyError } from 'client/scripts/controllers/app/notifications';

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
  curatorFee: number;
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
  return true;
};
const validateBeneficiary = (beneficiary: string) => {
  if (!beneficiary) return false;
  return true;
};
const validateCreator = (creator: string) => {
  if (!creator) return false;
  return true;
};
const validateFundraiseLength = (length: number) => {
  if (!length) return false;
  if (Number.isNaN(length)) return false;
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
  return true;
};

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
            vnode.attrs.form.title = e.target.value;
          }}
          inputValidationFn={(value) => {
            const isValid = validateTitle(value);
            if (!isValid) {
              return [
                'failed',
                `Name must be between 8-64 characters. Current count: ${length}`,
              ];
            }
          }}
        />
        {/* TODO: The below should be a textarea */}
        <CWTextInput
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
                'failed',
                `Input limit is 224 characters. Current count: ${length}`,
              ];
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
  view(vnode: m.Vnode<{ form: ICreateProjectForm }>) {
    return (
      <div class="FundraisingSlide">
        <CWText type="h1">Fundraising and Length</CWText>
        <CWText type="caption">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. iaculis donec
          sapien maecenas vel nisl faucibus ultricies.
        </CWText>
        <InputSelect
          items={['WETH', 'DAI', 'ALEX']}
          itemRender={(i) => {
            <CWText type="body1">{i}</CWText>;
          }}
          label="Raise In"
          name="Raise In"
          onSelect={(e) => {
            // TODO: Conversion to token address
            vnode.attrs.form.token = e.target.value;
          }}
        />
        <InputSelect
          items={['1 wk', '2 wk', '3 wk', '4 wk']}
          itemRender={(i) => {
            <CWText type="body1">{i}</CWText>;
          }}
          label="Fundraising Period"
          name="Fundraising Period"
          onSelect={(e) => {
            // TODO: Real length options & conversion to time
            const lengthInSeconds = +e.target.value.split(' ')[0] * 604800;
            vnode.attrs.form.fundraiseLength = lengthInSeconds;
          }}
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
          label="Curator Fee"
          name="Curator Fee"
          oninput={(e) => {
            vnode.attrs.form.curatorFee = Math.round(e.target.value * 100);
          }}
          inputValidationFn={(value) => {
            const isNotNumber = Number.isNaN(+value);
            const isNotPercent = +value > 100 || +value < 0;
            if (isNotNumber || isNotPercent) {
              return ['failed', 'Input must be valid number between 0 and 100'];
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
  view() {
    if (!this.stage) this.stage = 'information';
    if (!this.form)
      this.form = {
        title: '',
        token: '',
        beneficiary: '',
        description: '',
        shortDescription: '',
        coverImage: '',
        curatorFee: 0,
        threshold: 0,
        fundraiseLength: 0,
        chainId: app.activeChainId(),
      };
    console.log(this.stage);
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
