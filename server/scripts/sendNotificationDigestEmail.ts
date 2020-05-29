
const NO_CLIENT_SERVER = process.env.NO_CLIENT === 'true';
const DEV = process.env.NODE_ENV !== 'production';

import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));
