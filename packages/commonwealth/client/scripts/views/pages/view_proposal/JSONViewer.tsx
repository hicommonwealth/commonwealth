import React from 'react';
import ReactJson from 'react-json-view';

interface DataType {
  [key: string]: any;
}
const JSONViewer = ({ data }: { data: DataType }) => {
  return (
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
};

export default JSONViewer;
