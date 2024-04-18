import { stats } from '@hicommonwealth/core';
import * as dotenv from 'dotenv';

dotenv.config();
stats().increment('cw.scheduler.send-cosmos-notifs');
stats().increment('cw.scheduler.archive-outbox');
