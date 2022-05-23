/* @jsx m */

import m from 'mithril';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';

interface ICreateProjectForm {
  name: string;
  token: string;
  threshold: number;
  fundraiseLength: number;
  beneficiary: string;
  shortDescription: string;
  description: string;
}

export default class CreateProjectForm implements m.ClassComponent {
  private form: ICreateProjectForm;

  view() {
    return (
      <div class="CreateProjectForm">
        <CWTextInput
          label="Name"
          name="Name"
          oninput={(e) => {
            this.form.name = e.target.value;
          }}
        />
        <CWTextInput
          label="Raise In"
          name="Raise In"
          oninput={(e) => {
            this.form.token = e.target.value;
          }}
        />
        ,
        <CWTextInput
          label="Minimum Raise"
          name="Minimum Raise"
          oninput={(e) => {
            this.form.threshold = Number(e.target.value);
          }}
        />
        ,
        <CWTextInput
          label="Fundraise Length"
          name="Fundraise Length"
          oninput={(e) => {
            this.form.fundraiseLength = e.target.value;
          }}
        />
        ,
        <CWTextInput
          label="Beneficiary Address"
          name="Beneficiary Address"
          oninput={(e) => {
            this.form.beneficiary = e.target.value;
          }}
        />
        ,
        <CWTextInput
          label="Summary"
          name="Summary"
          oninput={(e) => {
            this.form.shortDescription = e.target.value;
          }}
        />
        ,
        <CWTextInput
          label="Description"
          name="Description"
          oninput={(e) => {
            this.form.description = e.target.value;
          }}
        />
        ,
      </div>
    );
  }
}
