import {
  GraphileTaskNames,
  type CustomCronItem,
} from '@hicommonwealth/model/services';
import { config } from '../../config';

function buildCustomCronItem({
  task,
  match,
}: {
  task: GraphileTaskNames;
  match: string;
}): CustomCronItem {
  return {
    task,
    match,
    options: {
      backfillPeriod: 0,
      maxAttempts: 3,
      queueName: task, // Ensure each cron job has its own queue
    },
  };
}

export const cronItems: Array<CustomCronItem | undefined> = [
  buildCustomCronItem({
    task: GraphileTaskNames.CleanSubscriptions,
    match: '0 8 * * *', // 8 AM everyday
  }),
  buildCustomCronItem({
    task: GraphileTaskNames.CleanChainEventXpSources,
    match: '0 9 * * *', // 9 AM everyday
  }),
  buildCustomCronItem({
    task: GraphileTaskNames.ArchiveOutbox,
    match: '0 10 * * *', // 10 AM everyday
  }),
  buildCustomCronItem({
    task: GraphileTaskNames.RunDbMaintenance,
    match: '0 11 * * *', // 11 AM everyday
  }),
  buildCustomCronItem({
    task: GraphileTaskNames.UpdateSitemap,
    match: '0 * * * *', // every hour
  }),
  buildCustomCronItem({
    task: GraphileTaskNames.CountAggregator,
    match: '*/10 * * * *', // every 10 minutes
  }),
  config.MAGNA.API_KEY
    ? buildCustomCronItem({
        task: GraphileTaskNames.MagnaSync,
        match: '0 * * * *', // every hour
      })
    : undefined,
  // config.MAGNA.API_KEY
  //   ? buildCustomCronItem({
  //       task: GraphileTaskNames.MagnaTxnSync,
  //       match: '30 * * * *', // every hour at 30 minutes past (30 min after MagnaSync)
  //     })
  //   : undefined,
  buildCustomCronItem({
    task: GraphileTaskNames.RefreshMaterializedViews,
    match: '*/30 * * * *', // every 30 minutes
  }),
];
