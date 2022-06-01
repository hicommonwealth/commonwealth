/* @jsx m */

import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import QuillEditor from 'client/scripts/views/components/quill_editor';
import m from 'mithril';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';

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
          defaultValue="Your Project Name Here"
          label="Name Your Crowdfund"
          name="Name"
          oninput={(e) => {
            vnode.attrs.form.name = e.target.value;
          }}
        />
        {/* TODO: Caption */}
        {m(QuillEditor, {
          oncreateBind: (state) => {
            vnode.attrs.form.description = state;
          },
          editorNamespace: 'project-description',
          placeholder:
            'Write a short 2 or 3 sentence description of your project,',
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
        <CWTextInput
          defaultValue="Select Token Type"
          label="Raise In"
          name="Raise In"
          oninput={(e) => {
            vnode.attrs.form.token = e.target.value;
          }}
        />
        <CWTextInput
          defaultValue="Your Project Name Here"
          label="Goal"
          name="Goal"
          oninput={(e) => {
            vnode.attrs.form.threshold = Number(e.target.value);
          }}
        />
        <CWTextInput
          defaultValue="Select Fundraise Length"
          label="Fundraising Period"
          name="Fundraising Period"
          oninput={(e) => {
            vnode.attrs.form.fundraiseLength = e.target.value;
          }}
        />
        <CWTextInput
          defaultValue="Address"
          label="Beneficiary Address"
          name="Beneficiary Address"
          oninput={(e) => {
            vnode.attrs.form.beneficiary = e.target.value;
          }}
        />
        <CWTextInput
          defaultValue="Set Quantity"
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
        <CWTextInput
          defaultValue="Your Summary Here"
          label="Short Description (Optional)"
          name="Short Description"
          oninput={(e) => {
            vnode.attrs.form.shortDescription = e.target.value;
          }}
        />
        ,
        <CWTextInput
          label="Description"
          name="Description"
          oninput={(e) => {
            vnode.attrs.form.description = e.target.value;
          }}
        />
      </div>
    );
  }
}

export default class CreateProjectForm implements m.ClassComponent {
  private form: ICreateProjectForm;
  private stage: 'information' | 'fundraising' | 'description';
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
      </div>
    );
  }
}
