import React from 'react';
import ReactJson from 'react-json-view';

import 'components/proposals/json_display.scss';
import { CWText } from '../../components/component_kit/cw_text';
import { CWDivider } from '../../components/component_kit/cw_divider';

type JSONDisplayProps = {
  data: object;
  title?: string;
};

const JSONViewer = ({ data }: { data: any }) => (
  <div className="Blob">
    <ReactJson
      src={data}
      theme="grayscale:inverted"
      style={{
        background: 'inherit',
      }}
      name={false}
      displayDataTypes={false}
      enableClipboard={false}
      displayObjectSize={false}
      quotesOnKeys={false}
      collapsed={true}
    />
  </div>
);

export const JSONDisplay = ({ data, title }: JSONDisplayProps) => {
  return (
    <div className="BlobContainer">
      {title && (
        <>
          <CWText type="b2" fontWeight="medium" className="labelText">
            {title}
          </CWText>
          <CWDivider />
        </>
      )}
      {Array.isArray(data) ? (
        data.map((d, i) => <JSONViewer data={d} key={i} />)
      ) : (
        <JSONViewer data={data} />
      )}
    </div>
  );
};
