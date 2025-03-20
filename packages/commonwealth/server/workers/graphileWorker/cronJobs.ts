import { CustomCronItem, GraphileTaskNames } from '@hicommonwealth/model';

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

export const cronItems: Array<CustomCronItem> = [
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
];
