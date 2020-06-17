import 'modals/new_tag_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Button, Input, Form, FormLabel, FormGroup } from 'construct-ui';

const NewTagModal = {
  confirmExit: async () => true,
  view: (vnode) => {
    return m('.NewTagModal', [
      m(Form, { class: 'compact-modal-body' }, [
        m(FormGroup, [
          m(FormLabel, 'Tag name'),
          m(Input, { class: 'new-tag-name', autofocus: true }),
        ]),
        m(FormGroup, [
          m(FormLabel, 'Description'),
          m(Input, { class: 'new-tag-description', autofocus: true }),
        ]),
        m(FormGroup, [
          m(Button, {
            label: 'Create tag',
            type: 'submit',
            intent: 'primary',
            onclick: (e) => {
              e.preventDefault();
              // if (!isCommunityAdmin()) return;
              const name = $(vnode.dom).find('input.new-tag-name').val().toString();
              const description = $(vnode.dom).find('input.new-tag-∂escription').val().toString();
              if (!name.trim()) return;
              app.tags.add(name, description).then(() => { m.redraw(); });
              $(vnode.dom).trigger('modalexit');
            }
          }),
          m(Button, {
            label: 'Cancel',
            intent: 'none',
            onclick: (e) => {
              e.preventDefault();
              $(vnode.dom).trigger('modalexit');
            }
          }),
        ]),
      ]),
    ]);
  }
};

export default NewTagModal;
