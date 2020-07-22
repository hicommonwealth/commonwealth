import 'components/tag_selector.scss';

import m from 'mithril';
import { SelectList, ListItem, Callout, Colors, Button, Icons, List } from 'construct-ui';

import app from 'state';
import NewTagModal from 'views/modals/new_tag_modal';
import { OffchainTag } from 'models';

const TagSelector: m.Component<{
  activeTag?: OffchainTag | string | boolean;
  featuredTags: OffchainTag[];
  tabindex?: number;
  tags: OffchainTag[];
  updateFormData: Function;
}, {
  error: string;
  selectedTag?: OffchainTag | string;
}> = {
  view: (vnode) => {
    const { activeTag, featuredTags, tabindex, tags, updateFormData } = vnode.attrs;
    if (activeTag === false) {
      delete vnode.state.selectedTag;
    } else if (activeTag) {
      (vnode.state.selectedTag as any) = activeTag;
    }

    const itemRender = (tag) => {
      return m(ListItem, {
        class: featuredTags.includes(tag) ? 'featured-tag' : 'other-tag',
        label: [
          m('span.proposal-tag-icon'),
          m('span.tag-name', tag.name),
        ],
        selected: (vnode.state.selectedTag as OffchainTag)?.name === tag.name,
      });
    };

    const itemPredicate = (query: string, item: OffchainTag) => {
      return item.name.toLowerCase().includes(query.toLowerCase());
    };

    const onSelect = (item: OffchainTag) => {
      vnode.state.selectedTag = item;
      updateFormData(item.name, item.id);
    };

    const manuallyClosePopover = () => {
      const button = document.getElementsByClassName('tag-selection-drop-menu')[0];
      if (button) (button as HTMLButtonElement).click();
    };

    const addTag = (tag?) => {
      const newTag = tag || (document.getElementsByClassName('autocomplete-tag-input')[0]
        .firstChild as HTMLInputElement).value;
      tags.push({ name: newTag, id: null, description: '' });
      setTimeout(() => { vnode.state.selectedTag = newTag; m.redraw(); }, 1);
      updateFormData(newTag);
      if (!tag) manuallyClosePopover();
    };

    const sortTags = (tags_: OffchainTag[]) => {
      return tags_.filter((tag) => featuredTags.includes(tag)).sort((a, b) => a.name > b.name ? 1 : -1)
        .concat(tags_.filter((tag) => !featuredTags.includes(tag)).sort((a, b) => a.name > b.name ? 1 : -1));
    };

    return m(SelectList, {
      class: 'TagSelector',
      filterable: false,
      checkmark: false,
      closeOnSelect: true,
      emptyContent: [
        m(Callout, {
          class: 'no-matching-tags',
          icon: Icons.ALERT_TRIANGLE,
          intent: 'negative',
          content: 'This community has not been configured with tags yet',
        }),
      ],
      itemPredicate,
      itemRender,
      items: sortTags(tags),
      onSelect,
      trigger: m(Button, {
        align: 'left',
        class: 'tag-selection-drop-menu',
        compact: true,
        iconRight: Icons.CHEVRON_DOWN,
        label: vnode.state.selectedTag
          ? [
            m('span.proposal-tag-icon'),
            m('span.tag-name', ((vnode.state.selectedTag as OffchainTag).name || (vnode.state.selectedTag as string)))
          ]
          : '',
        sublabel: vnode.state.selectedTag ? '' : 'Select a tag',
        tabindex
      }),
    });
  },
};

export default TagSelector;
