import { models } from '@hicommonwealth/model';
import { Job, TaskSpec } from 'graphile-worker';
import { QueryTypes, Transaction } from 'sequelize';
import { z } from 'zod';
import { preset } from './graphile.config';
import { GraphileTaskNames, TaskPayloads } from './types';

export async function scheduleTask<Name extends GraphileTaskNames>(
  taskName: Name,
  payload: z.infer<(typeof TaskPayloads)[Name]>,
  options?: TaskSpec & { transaction?: Transaction },
): Promise<Job> {
  let useNodeTime = false;
  if (
    preset.worker &&
    'useNodeTime' in preset.worker &&
    preset.worker.useNodeTime
  )
    useNodeTime = preset.worker.useNodeTime;

  const jobs = await models.sequelize.query<Job>(
    `
        SELECT *
        FROM ${preset.worker!.schema!}.add_job(
                identifier => :identifier::text,
                payload => :payload::json,
                queue_name => :queue_name::text,
                run_at => :run_at::timestamptz,
                max_attempts => :max_attempts::int,
                job_key => :job_key::text,
                priority => :priority::int,
                flags => :flags::text[],
                job_key_mode => :job_key_mode::text
             );
    `,
    {
      replacements: {
        identifier: taskName,
        payload: JSON.stringify(payload ?? {}),
        queue_name: options?.queueName ?? null,
        run_at: options?.runAt
          ? options.runAt.toISOString()
          : useNodeTime
            ? new Date().toISOString()
            : null,
        max_attempts: options?.maxAttempts || null,
        job_key: options?.jobKey ?? null,
        priority: options?.priority ?? null,
        flags: options?.flags ?? null,
        job_key_mode: options?.jobKeyMode ?? null,
      },
      type: QueryTypes.SELECT,
      transaction: options?.transaction,
    },
  );
  const job = jobs[0];
  job.task_identifier = taskName;
  return job;
}
