/* @jsx m */

import { CWText } from 'views/components/component_kit/cw_text';
import QuillEditor from 'views/components/quill_editor';
import m from 'mithril';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { ButtonGroup, Button, Input, InputSelect } from 'construct-ui';
import app from 'state';

interface ICreateProjectForm {
  name: string;
  token: string;
  threshold: number;
  fundraiseLength: number;
  beneficiary: string;
  curatorFee: string;
  description: string;
  shortDescription: string;
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
        />
        {/* TODO: Caption */}
        {m(QuillEditor, {
          oncreateBind: (state) => {
            vnode.attrs.form.shortDescription = state;
          },
          editorNamespace: 'project-short-description',
          placeholder: 'Write a short 2 or 3 sentence summary of your project,',
        })}
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
            vnode.attrs.form.token = e.target.value;
          }}
        />
        <InputSelect
          items={['1 wk', '2 wk', '3 wk', '4wk']}
          itemRender={(i) => {
            <CWText type="body1">{i}</CWText>;
          }}
          label="Fundraising Period"
          name="Fundraising Period"
          onSelect={(e) => {
            vnode.attrs.form.fundraiseLength = e.target.value;
          }}
        />
        <CWTextInput
          placeholder="Address"
          label="Beneficiary Address"
          name="Beneficiary Address"
          oninput={(e) => {
            vnode.attrs.form.beneficiary = e.target.value;
          }}
        />
        <CWTextInput
          placeholder="Set Quantity"
          label="Curator Fee"
          name="Curator Fee"
          oninput={(e) => {
            vnode.attrs.form.curatorFee = e.target.value;
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
        name: null,
        token: null,
        threshold: null,
        fundraiseLength: null,
        beneficiary: null,
        curatorFee: null,
        description: null,
        shortDescription: null,
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
