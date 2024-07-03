import React from 'react';
import ReactJson from 'react-json-view';

const JSONViewer = ({ data }: { data: Record<string, any> }) => {
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
