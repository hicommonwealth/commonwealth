import { ListType } from 'views/components/MarkdownEditor/toolbars/ListButton';

export function listTypeToIconName(listType: ListType) {
  switch (listType) {
    case 'number':
      return 'listNumbers';
    case 'bullet':
      return 'listDashes';
    case 'check':
      return 'listChecks';
  }
}
