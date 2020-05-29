import 'components/autocomplete_tag_form.scss';

import { default as m } from 'mithril';
import { symbols } from '../../helpers';
import { AutoCompleteForm } from './autocomplete_input';
import { SelectList, ListItem, Colors, Button, Icons } from 'construct-ui';
import { OffchainTag } from 'client/scripts/models';


interface IAutoCompleteTagFormAttrs {
  results: OffchainTag[];
  featuredTags;
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
      items: vnode.state.tags,
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
