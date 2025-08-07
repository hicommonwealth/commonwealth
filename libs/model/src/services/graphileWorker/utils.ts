import { DbJob, Job, TaskSpec } from 'graphile-worker';
import { QueryTypes, Transaction } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { preset } from './graphile.config';
import { GraphileTaskNames, TaskPayloads } from './types';

export async function rescheduleJobs({
  jobIds,
  options,
  transaction,
}: {
  jobIds: string[];
  options: {
    runAt?: string | Date;
    priority?: number;
    attempts?: number;
    maxAttempts?: number;
  };
  transaction?: Transaction;
}): Promise<DbJob[]> {
  return await models.sequelize.query<DbJob>(
    `
        SELECT *
        FROM ${preset.worker!.schema!}.reschedule_jobs(
                (:jobIds)::bigint[],
                run_at := :runAt::timestamptz,
                priority := :priority::int,
                attempts := :attempts::int,
                max_attempts := :maxAttempts::int
             )
    `,
    {
      replacements: {
        jobIds,
        runAt: options.runAt || null,
        priority: options.priority || null,
        attempts: options.attempts || null,
        maxAttempts: options.maxAttempts || null,
      },
      type: QueryTypes.SELECT,
      transaction,
    },
  );
}

export async function removeJob({
  jobId,
  transaction,
}: {
  jobId: string;
  transaction?: Transaction;
}): Promise<DbJob> {
  const res = await models.sequelize.query<DbJob>(
    `
    SELECT ${preset.worker!.schema!}.remove_job(:job_id::text);
  `,
    {
      replacements: {
        job_id: jobId,
      },
      type: QueryTypes.SELECT,
      transaction,
    },
  );
  return res[0];
}

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
