import { HotShotsStats } from '@hicommonwealth/adapters';
import { stats } from '@hicommonwealth/core';
import * as dotenv from 'dotenv';

dotenv.config();
stats(HotShotsStats()).increment('cw.scheduler.send-cosmos-notifs');
stats(HotShotsStats()).increment('cw.scheduler.archive-outbox');
