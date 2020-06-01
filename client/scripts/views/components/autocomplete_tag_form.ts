import 'components/autocomplete_tag_form.scss';

import { default as m } from 'mithril';
import { SelectList, ListItem, Colors, Button, Icons, List } from 'construct-ui';
import { OffchainTag } from 'client/scripts/models';


interface IAutoCompleteTagFormAttrs {
  defaultActiveIndex?: number;
  tags: OffchainTag[];
  featuredTags: OffchainTag[];
  tabindex?: number;
  updateFormData: Function;
  updateParentErrors?: Function;
}

interface IAutoCompleteTagFormState {
  error: string;
  selectedTag: OffchainTag;
}

const AutoCompleteTagForm: m.Component<IAutoCompleteTagFormAttrs, IAutoCompleteTagFormState> = {
  view: (vnode) => {
    const { featuredTags, tags, updateFormData } = vnode.attrs;

    const itemRender = (tag) => {
      return m(ListItem, {
        class: featuredTags.includes(tag) ? 'featured-tag' : 'other-tag',
        contentLeft: m('.tagItem', `# ${tag.name}`),
        selected: vnode.state.selectedTag && vnode.state.selectedTag.name === tag.name,
      });
    };

    const itemPredicate = (query: string, item: OffchainTag) => {
      return item.name.toLowerCase().includes(query.toLowerCase());
    };

    const onSelect = (item: OffchainTag) => {
      vnode.state.selectedTag = item;
      updateFormData(item);
    };

    // const manuallyClosePopover = () => {
    //   const button = document.getElementsByClassName('tag-selection-drop-menu')[0];
    //   if (button) (button as HTMLButtonElement).click();
    // };

    const selectTag = (e: Event) => {
      const { innerText } = (e.target as HTMLElement);
      const tag = tags.filter((t) => t.name === innerText.slice(2))[0];
      vnode.state.selectedTag = tag;
      updateFormData(tag);
    };

    const sortTags = (tags_: OffchainTag[]) => {
      return tags_.filter((tag) => featuredTags.includes(tag)).sort((a, b) => a.name > b.name ? 1 : -1)
        .concat(tags_.filter((tag) => !featuredTags.includes(tag)).sort((a, b) => a.name > b.name ? 1 : -1));
    };

    return m(SelectList, {
      class: 'AutocompleteTagForm',
      emptyContent: m('.no-matching-tags', { onclick: selectTag }, 'No matching tags found'),
      itemPredicate,
      itemRender,
      items: sortTags(tags),
      onSelect,
      trigger: m(Button, {
        align: 'left',
        class: 'tag-selection-drop-menu',
        compact: true,
        iconRight: Icons.CHEVRON_DOWN,
        sublabel: 'Category',
        label: vnode.state.selectedTag && vnode.state.selectedTag.name,
      })
    });
  },
};

export default AutoCompleteTagForm;
