import syncRequest from "sync-request";
import {syncPerformanceTester} from "./util";

let url = 'http://localhost:8080/api/status';
const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIxMTMsImVtYWlsIjpudWxsLCJpYXQiOjE2NTI2NzA4MDR9.WN5vxIaAcAzpNvTJiCeelm071yErhRtcEgXbA5iS-wA";
const options = {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `jwt ${jwt}`,
    },
}
function sync_requests() {
    const res = syncRequest('GET', url, options);
    if (res.statusCode !== 200) {
        console.log("Request error");
        process.exit(1);
    }
}

syncPerformanceTester(10, 20, sync_requests, true, null);
