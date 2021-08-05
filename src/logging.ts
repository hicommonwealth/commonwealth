import { Logger } from 'tslog';

const log = new Logger({
  minLevel: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
  colorizePrettyLogs: process.env.NODE_ENV !== 'production',
  displayFunctionName: false,
  displayFilePath: 'displayAll',
  overwriteConsole: true,
});
export default log;
