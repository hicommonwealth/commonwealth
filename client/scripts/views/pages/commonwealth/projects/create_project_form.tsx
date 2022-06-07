/* @jsx m */

import { CWText } from 'views/components/component_kit/cw_text';
import QuillEditor from 'views/components/quill_editor';
import m from 'mithril';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { ButtonGroup, Button, InputSelect } from 'construct-ui';
import { ValidationStatus } from 'views/components/component_kit/cw_validation_text';

interface ICreateProjectForm {
  // Descriptive
  name: string;
  description: string;
  shortDescription: string;
  coverImage: string;

  // Mechanical
  token: string;
  threshold: number;
  beneficiary: string;
  fundraiseLength: number;
  curatorFee: number;
}

class CoverImageUpload
  implements m.ClassComponent<{ form: ICreateProjectForm }>
{
  view(vnode: m.Vnode<{ form: ICreateProjectForm }>) {
    return null;
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
            vnode.attrs.form.name = e.target.value;
          }}
          inputValidationFn={(value) => {
            const { length } = value;
            if (length < 8 || length > 64) {
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
          label="Brief Description"
          name="Brief Description"
          oninput={(e) => {
            vnode.attrs.form.name = e.target.value;
          }}
          inputValidationFn={(value) => {
            const { length } = value;
            if (length > 215) {
              return [
                'failed',
                `Input limit is 215 characters. Current count: ${length}`,
              ];
            }
          }}
        />
        {/* TODO: Image upload */}
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
        name: '',
        token: '',
        beneficiary: '',
        description: '',
        shortDescription: '',
        coverImage: '',
        curatorFee: 0,
        threshold: 0,
        fundraiseLength: 0,
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
              },
            }),
          ]
        )}
      </div>
    );
  }
}
