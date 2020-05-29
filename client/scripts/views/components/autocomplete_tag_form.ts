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
    const TagItem = (tag: OffchainTag, index?: number) => {
      return m(ListItem, {
        contentLeft: m('.tagItem', `# ${tag.name}`),
        key: index,
        selected: vnode.state.selectedTag && vnode.state.selectedTag.name === tag.name
      });
    };

    const featuredTags = vnode.attrs.featuredTags.map((tag) => TagItem(tag));

    return m(SelectList, {
      emptyContent: m('.no-matching-tags', {
        onclick: () => null
      }, 'No matching tags found'),
      initialContent: featuredTags,
      itemRender: TagItem,
      items: vnode.attrs.tags,
      onSelect: (item: OffchainTag) => {
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
