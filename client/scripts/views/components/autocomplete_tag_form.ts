import 'components/autocomplete_tag_form.scss';

import { default as m } from 'mithril';
import { SelectList, ListItem, Colors, Button, Icons } from 'construct-ui';
import { OffchainTag } from 'client/scripts/models';


interface IAutoCompleteTagFormAttrs {
  tags: OffchainTag[];
  featuredTags: OffchainTag[];
  tabindex?: number;
  updateFormData: Function;
  updateParentErrors: Function;
}

interface IAutoCompleteTagFormState {
  error: string;
  selectedTag: OffchainTag;
}

const AutoCompleteTagForm: m.Component<IAutoCompleteTagFormAttrs, IAutoCompleteTagFormState> = {
  view: (vnode) => {
    const TagItem = (tag: OffchainTag, index?: number, onclick?: (e: Event) => void) => {
      return m(ListItem, {
        allowOnContentClick: true,
        contentLeft: m('.tagItem', `# ${tag.name}`),
        key: index,
        selected: vnode.state.selectedTag && vnode.state.selectedTag.name === tag.name,
        onclick
      });
    };

    const manuallyClosePopover = () => {
      const button = document.getElementsByClassName('cui-popover-trigger-active')[0]
      if (button) (button as HTMLButtonElement).click();
    };

    const selectTag = (e: Event) => {
      const { innerText } = (e.target as HTMLElement);
      const tag = vnode.attrs.tags.filter((t) => t.name === innerText.slice(2))[0];
      vnode.state.selectedTag = tag;
      vnode.attrs.updateFormData(tag);
      manuallyClosePopover();
    };

    const featuredTags = vnode.attrs.featuredTags.map((tag, idx) => TagItem(tag, idx, selectTag));

    return m(SelectList, {
      closeOnSelect: false,
      emptyContent: m('.no-matching-tags', { onclick: selectTag }, 'No matching tags found'),
      initialContent: featuredTags,
      itemRender: TagItem,
      items: vnode.attrs.tags,
      onSelect: (item: OffchainTag) => {
        console.log('selected');
        vnode.state.selectedTag = item;
        vnode.attrs.updateFormData(item);
      },
      trigger: m(Button, {
        align: 'left',
        compact: true,
        iconRight: Icons.CHEVRON_DOWN,
        sublabel: 'Category',
        label: vnode.state.selectedTag && vnode.state.selectedTag.name,
      })
    });
  },
};

export default AutoCompleteTagForm;
