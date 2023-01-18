/* @jsx m */

import { CWText } from 'views/components/component_kit/cw_text';
import { QuillEditor } from 'views/components/quill/quill_editor';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import m from 'mithril';
import ClassComponent from 'class_component';
import { ICreateProjectForm } from '../types';

export class DescriptionSlide extends ClassComponent<{
  form: ICreateProjectForm;
}> {
  view(vnode: m.Vnode<{ form: ICreateProjectForm }>) {
    return (
      <form class="DescriptionSlide">
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
      </form>
    );
  }
}
