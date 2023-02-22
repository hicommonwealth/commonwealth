import React from 'react';

import 'components/overview_table.scss';
import { CWText } from './component_kit/cw_text';

type TableTitle = {
  label: string;
  key: string;
}

type OverviewTableProps = {
  title: string;
  columns: TableTitle[];
  data: any;
};

export const OverviewTable = (props: OverviewTableProps) => {
  const { title, columns, data } = props;

  return (
    <div className="OverviewTable">
      <div className="title">
        <CWText type="h5" fontWeight="semiBold">{title}</CWText>
      </div>
      <div className="row">
        {columns.map((column) => (
          <CWText
            type="caption"
            className="column"
            key={column.key}
            fontWeight="medium"
          >{column.label}</CWText>
        ))}
      </div>
      {data.map((row, i) => (
        <div className="row" key={i}>
          {columns.map((column) => (
            column.key === 'member' ? (
              <div className="member">
                <img className="icon" src={row[column.key].iconUrl} />
                <CWText>{row[column.key].username}</CWText>
                <CWText className="profile-name">{row[column.key].profileName}</CWText>
              </div>
            ) : (
              <CWText>{row[column.key]}</CWText>
            )
          ))}
        </div>
      ))}
    </div>
  );
};
