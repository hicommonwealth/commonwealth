import m from 'mithril';
import app from 'state';
import SubkeyInstructionsModal from 'views/modals/subkey_instructions_modal';

interface IAttrs {
  text?: string;
}

const SubkeyInstructions: m.Component<IAttrs> = {
  view: (vnode: m.VnodeDOM<IAttrs>) => {
    return m('span.SubkeyInstructions', [
      m('a.show-instructions', {
        href: '#',
        onclick: (e) => {
          e.preventDefault();
          app.modals.create({ modal: SubkeyInstructionsModal });
        },
      }, vnode.attrs.text || 'Subkey help'),
    ]);
  }
};

export default SubkeyInstructions;
