/* @jsx m */
import m from 'mithril';

import CWCoverImageUploader from '../../../components/component_kit/cw_cover_image_uploader';
import { CWText } from '../../../components/component_kit/cw_text';
import { CWTextArea } from '../../../components/component_kit/cw_text_area';
import { CWTextInput } from '../../../components/component_kit/cw_text_input';
import { validateProjectForm } from '../helpers';
import { ICreateProjectForm } from '../types';

export class InformationSlide
  implements m.ClassComponent<{ form: ICreateProjectForm }>
{
  view(vnode: m.Vnode<{ form: ICreateProjectForm }>) {
    if (!vnode.attrs.form.creator) return;
    return (
      <form class="InformationSlide">
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
          required
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
        <CWCoverImageUploader
          headerText="Cover Image"
          subheaderText="Use an image that helps people connect with your crowdfund right away"
          uploadCompleteCallback={(imageURL: string) => {
            vnode.attrs.form.coverImage = imageURL;
          }}
        />
      </form>
    );
  }
}
