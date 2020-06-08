import 'modals/subkey_instructions_modal.scss';

import m from 'mithril';
import CodeBlock from 'views/components/widgets/code_block';

const SubkeyInstructionsModal: m.Component<{}> = {
  view: (vnode) => {
    return m('.SubkeyInstructionsModal', [
      m('.compact-modal-title', [
        m('h3', 'Using subkey'),
      ]),
      m('.compact-modal-body', [
        m('p', 'First, install rust and cargo by running the following script in your terminal:'),
        m(CodeBlock, { clickToSelect: true },
          'curl https://sh.rustup.rs -sSf | sh'),
        m('p', 'Execute the following script once cargo is installed:'),
        m(CodeBlock, { clickToSelect: true },
          'cargo install --force --git https://github.com/paritytech/substrate subkey'),
        m('p', 'Create an address by running the following command:'),
        m(CodeBlock, { clickToSelect: true }, 'subkey generate'),
        m('p', 'Save the output somewhere safe. It should look like this:'),
        m(CodeBlock,
          `Phrase \`welcome draft actor now search injury enhance cigar misery move december essay\` is account:
Seed: 0xa2cc1ebe0a6cb0ae78311cd37156aac988e61c312d73cafe357cc2f1fd069e09
Public key (hex): 0xb2d1bda2d363cf25a26a9fb34ea314dc8981e378ca4797c52117f65731602826
Address (SS58): 5G7AgnBBNvdDYRVvcCYz95pMjGtS3ouWaq23Dcqe6rDjDuh7`),
        m('p', [
          'Your public address is the part labeled ',
          m('strong', 'Address (SS58)'),
          '.'
        ]),
        m('p', 'Keep your private key phrase safe. You will use it to sign transactions, vote, and transfer EDG.')
      ]),
    ]);
  }
};

export default SubkeyInstructionsModal;
