export const getColumnInfo = () => {
  return [
    {
      key: 'name',
      header: 'Name',
      numeric: false,
      sortable: true,
    },
    {
      key: 'voteWeight',
      header: 'Vote Weight',
      numeric: true,
      sortable: true,
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      numeric: true,
      sortable: true,
      chronological: true,
    },
  ];
};
