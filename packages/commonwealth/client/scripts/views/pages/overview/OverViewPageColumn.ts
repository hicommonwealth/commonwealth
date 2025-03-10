import { CWTableColumnInfo } from '../../components/component_kit/new_designs/CWTable/CWTable';

const OverViewPageColumn: CWTableColumnInfo[] = [
  {
    key: 'title',
    header: 'Title',
    hasCustomSortValue: true,
    numeric: false,
    sortable: true,
  },
  {
    key: 'topic',
    header: 'Topic',
    hasCustomSortValue: false,
    numeric: false,
    sortable: true,
  },
  {
    key: 'createdAt',
    header: 'Created Date',
    numeric: false,
    sortable: true,
  },

  {
    key: 'viewCount',
    header: 'Views',
    numeric: false,
    sortable: true,
  },
];

export default OverViewPageColumn;
