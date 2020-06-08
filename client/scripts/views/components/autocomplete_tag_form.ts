import 'components/autocomplete_tag_form.scss';

import m from 'mithril';
import { SelectList, ListItem, Colors, Button, Icons, List } from 'construct-ui';
import { OffchainTag } from 'client/scripts/models';
import { symbols } from '../../helpers';
import { AutoCompleteForm } from './autocomplete_input';


interface IAutoCompleteTagFormAttrs {
  results: any;
  updateFormData?: CallableFunction;
  updateParentErrors: CallableFunction;
  tabindex?: number;
}

interface IAutoCompleteTagFormState {
  error: string;
  noMatches: boolean;
  tags: string[];
}

const AutoCompleteTagForm: m.Component<IAutoCompleteTagFormAttrs, IAutoCompleteTagFormState> = {
  view: (vnode) => {
    if (!vnode.state.tags) vnode.state.tags = [];

    const TagItem = (tag: string, onclick: CallableFunction, handlerType: string) => m('span.TagItem', {
      key: tag,
      class: handlerType === 'addTag' ? 'addable' : 'removable',
      href: '#',
      onclick,
    }, [
      m('a.tag', handlerType === 'addTag' ? tag : `#${tag}`),
    ]);

    const TagList = () => vnode.state.tags.map((tag) => {
      const removeTag = (e) => {
        e.preventDefault();
        vnode.state.tags = vnode.state.tags.filter((t) => t !== tag);
        vnode.attrs.updateParentErrors();
      };
      return TagItem(tag, removeTag, 'removeTag');
    });

    const clearAutoComplete = (inputEle) => {
      inputEle.value = '';
      vnode.state.noMatches = false;
      (document.getElementsByClassName('results')[0] as HTMLInputElement)
        .classList.remove('show');
      (document.getElementsByClassName('autocomplete-wrap')[0] as HTMLInputElement)
        .classList.remove('displaying-results');
      m.redraw();
      inputEle.focus();
    };

    const addTag = (tag: string) => {
      if (!tag.length) return;
      const { tags } = vnode.state;
      const { updateFormData } = vnode.attrs;
      const formInput = (document.getElementsByClassName('autocomplete-entry')[0] as HTMLInputElement);
      if (tags.length === 1) {
        clearAutoComplete(formInput);
        vnode.attrs.updateParentErrors('You can only select a single tag');
        return;
      }
      for (const t of tags) {
        if (t.toLowerCase() === tag.toLowerCase()) {
          clearAutoComplete(formInput);
          return;
        }
      }
      vnode.attrs.updateParentErrors();
      vnode.state.tags.push(tag);
      updateFormData(vnode.state.tags);
      clearAutoComplete(formInput);
    };

    const addTagWrap = (e) => {
      e.preventDefault();
      const formInput = (document.getElementsByClassName('autocomplete-entry')[0] as HTMLInputElement);
      const tag = vnode.state.noMatches ? formInput.value : e.target.innerText;
      addTag(tag);
    };

    const rowComponentFunc = (res) => TagItem(res.name, addTagWrap, 'addTag');

    const onChangeHandler = (result) => {
      if (!result.length) return false;
      delete vnode.state.error;
      if (result.length === 1) {
        const formInput = (document.getElementsByClassName('autocomplete-entry')[0] as HTMLInputElement);
        formInput.addEventListener('keyup', (e) => {
          if (e.keyCode === 13) addTag(formInput.value);
        });
      }
      const results = vnode.attrs.results
        .filter((t) => (t.name.toLowerCase().indexOf(result.toLowerCase()) !== -1))
        .sort((a, b) => a.name - b.name);
      vnode.state.noMatches = !results.length;
      const truncatedResults = vnode.state.noMatches
        ? [{ name: `New tag '${result}'...` }]
        : results.slice(0, Math.min(10, results.length));
      return truncatedResults;
    };

    return m('.AutoCompleteTagForm', [
      m('.top-wrap', [
        m('.left-panel', [
          m(AutoCompleteForm, {
            placeholder: 'Select a category',
            results: vnode.attrs.results || [],
            applyDefaultHandler: true,
            onChangeHandler,
            rowComponentFunc,
            tabindex: vnode.attrs.tabindex,
          }),
        ]),
        m('.right-panel', TagList()),
      ]),
    ]);
  },
};

export default AutoCompleteTagForm;
