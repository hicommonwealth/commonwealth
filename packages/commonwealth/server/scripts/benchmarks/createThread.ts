// const fetch = require('node-fetch');
import syncRequest from 'sync-request';
import { syncPerformanceTester } from './util';

const jwt =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIxMTMsImVtYWlsIjpudWxsLCJp' +
  'YXQiOjE2NTI2NzA4MDR9.WN5vxIaAcAzpNvTJiCeelm071yErhRtcEgXbA5iS-wA';
const url = 'http://localhost:8080/api/threads';

const options = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `jwt ${jwt}`,
  },
  body: `{"author_chain":"ethereum","author":{},"chain":"ethereum",
  "address":"0x2cE1F5d4f84B583Ab320cAc0948AddE52a131FBE","title":"Testing","body":"This is the thread body",
  "kind":"forum","stage":"discussion","thirdImage.com"],
  "topic_name":"General","topic_id":96,"jwt":"${jwt}"}`,
};

function sync_requests() {
  const res = syncRequest('POST', url, options);
  if (res.statusCode !== 200) {
    console.log('Request error');
    process.exit(1);
  }
}

// 10 samples of 100 synchronous queries each
syncPerformanceTester(10, 100, sync_requests, true, null);

// 100 simultaneous queries
// asyncPerformanceTester(100, async_requests);
