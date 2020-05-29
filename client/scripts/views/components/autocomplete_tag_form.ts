import 'components/autocomplete_tag_form.scss';

import { default as m } from 'mithril';
import { SelectList, ListItem, Colors, Button, Icons } from 'construct-ui';
import { OffchainTag } from 'client/scripts/models';


interface IAutoCompleteTagFormAttrs {
  tags: OffchainTag[];
  featuredTags: number[];
  tabindex?: number;
}

interface IAutoCompleteTagFormState {
  error: string;
  selectedTag: number;
}

const AutoCompleteTagForm: m.Component<IAutoCompleteTagFormAttrs, IAutoCompleteTagFormState> = {
  view: (vnode) => {
    const TagItem = (tag: OffchainTag, index: number) => {
      return m(ListItem, {
        contentRight: m('.tagItem', { style: `color:${Colors.BLUE_GREY200}` }, tag.name),
        key: index,
        label: tag.name,
        selected: this.selectedItem && this.selectedItem.name === tag.name,
      });
    };

    return m(SelectList, {
      emptyContent: vnode.attrs.featuredTags,
      itemRender: TagItem,
      items: vnode.attrs.tags,
      onSelect: (item: OffchainTag) => {
        vnode.state.selectedTag = item.id;
      },
      trigger: m(Button, {
        align: 'left',
        compact: true,
        iconRight: Icons.CHEVRON_DOWN,
        sublabel: 'Category',
        label: this.selectedItem && this.selectedItem.name,
      })
    });
  },
};

export default AutoCompleteTagForm;
