import 'components/widgets/character_limited_text_input.scss';

import { default as m } from 'mithril';
import { default as _ } from 'lodash';
import { default as $ } from 'jquery';

const debouncedRedraw = _.debounce(() => { m.redraw(); }, 100, { leading: true, trailing: true });

interface IAttrs {
  title?: string;
  name?: string;
  placeholder?: string;
  id?: string;
  limit: number;
  onkeyup?: any;
  _onkeyup?: any;
}

interface IState {
  chars: number;
  overLimit: boolean ;
}

const CharacterLimitedTextInput: m.Component<IAttrs, IState> = {
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    // display the number of characters left in the limit
    const limit = vnode.attrs.limit || 140;
    const displayedLimit = vnode.state.chars ? `${vnode.state.chars}/${limit}` : limit;

    const attrs = vnode.attrs;
    attrs._onkeyup = attrs.onkeyup;
    attrs.onkeyup = (e) => {
      if (e.target && e.target.value !== undefined) {
        vnode.state.chars = e.target.value.length;
        vnode.state.overLimit = vnode.state.chars > limit;
        debouncedRedraw();
      }
      if (attrs._onkeyup) attrs._onkeyup(e);
    };

    return m('.CharacterLimitedTextInput', {
      oncreate: (vnode) => setTimeout((() => $(vnode.dom).find('input[type="text"]').trigger('keyup')), 0)
    }, [
      m('input[type="text"]', attrs),
      m('.character-limit-remaining', {
        class: vnode.state.overLimit ? 'over-limit' : '',
      }, displayedLimit),
    ]);
  }
};

export default CharacterLimitedTextInput;
