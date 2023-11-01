# Background Scheduler

## Contents

- [Heroku Scheduler](#heroku-scheduler)
  + [Overview](#overview)
  + [Best Practice](#best-practice)
  + [Sample Code](#sample-code)
  + [Debugging](#debugging)
  + [Scheduling Options](#scheduling-options)
  + [Deployment](#deployment)
- [Scheduling externally vs in-memory](#scheduling-externally-vs-in-memory)
- [Cron To Go: An Alternative](#cron-to-go-an-alternative)
  + [Features](#features)

## Heroku Scheduler

### Overview

- **Cost**: Free for experimentation on the development environment.
- **Dynos**: Uses [one-off dynos](https://devcenter.heroku.com/articles/one-off-dynos) akin to the `heroku run` command for executing jobs.
- **Environment**: All app environment variables, including DATABASE_URL, are readily available.
- **Entry Point**: Post-installation, the user's script serves as the dyno's entry point.
- **Integration with Datadog**: There's a possibility that one-off dynos may not integrate seamlessly with Datadog. However, this can be confirmed upon testing.
- **Commandline**: Tools like psql, yarn, and others are accessible via the command line. This flexibility allows for the scheduling of raw commands. For instance:

```bash
psql $DATABASE_URL -c "SELECT * FROM \"Threads\" LIMIT 1"
```

![image](https://github.com/hicommonwealth/commonwealth/assets/4791635/f6ca8c80-b73e-4b19-87a0-02ce98030841)

### Best Practice

- **Script Exit**: Ensure scripts terminate correctly in both successful and error scenarios.
- **Error Handling**: In case of errors, utilize `process.exit(non-zero code)` to exit the script.
- **Logging**: Implement console logs at the beginning and end of the script. Also, log the duration it took for the script to execute.
- **Testing**: Always test on the Heroku Scheduler in the development environment before deploying to production.
- **Unit/Integration Tests**: Incorporate unit and integration tests to safeguard against script failures due to future refactors.

### Sample Code

- **Purpose**: The sample code demonstrates how to structure a script to ensure it runs correctly when executed directly or imported. This structure aids in integrating scripts with unit tests and ensures proper exit when running on the scheduler.
- **Error Handling**: The code includes a try-catch block to handle any potential errors during execution.
  
```javascript
export async function recomputeCounts() {
  // Your code here
}

if (!module.parent) {
  console.log('recompute job started');
  recomputeCounts()
    .then(() => {
      console.log('recompute job completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.log('recompute job exit with error');
      console.log(err);
      process.exit(1);
    });
}
```

By following these best practices and using the provided sample code as a template, you can ensure that your scripts run efficiently and effectively on the Heroku Scheduler.

### Debugging

- **Console Logs**: Use console logs for initial debugging during trial runs.
- **Streaming Logs**: To monitor logs in real-time, stream them to your local machine using the following commands:

```bash
heroku logs -a commonwealth-frick -t
heroku logs -a commonwealth-frick -t | grep "app\[scheduler"
```

![image](https://github.com/hicommonwealth/commonwealth/assets/4791635/a372876a-0f79-45b6-8828-557245f3a25c)

### Scheduling Options

- **Frequency**: Options include every 10 minutes, hourly, or daily.
  ![Scheduling UI](https://github.com/hicommonwealth/commonwealth/assets/4791635/492ef824-c5df-4389-bd9b-aa32db048608)

### Deployment

- **UI Dependency**: Jobs can only be added through the UI.
- **Package Installation**: All required packages are installed automatically similarly to the main app dyno. Tasks can be executed using npm scripts, for example:

```bash
yarn --cwd packages/commonwealth recompute-counts
```

## Scheduling externally vs in-memory

In general, scheduling externally is better than using javascript `settimeout`

 `settimeout`

- it can be unreliable, especially during server restarts.
- Coordinating tasks across multiple servers using locks in Redis can be complex.
- In-house solutions for in-memory scheduling lack maturity in terms of how to time jobs across multiple server and lacks visibility.

`scheduling externally`

- Operates on a separate dyno, ensuring the main server's compute resources are not utilized.
- Offers superior scheduling capabilities.
- Provides a dashboard to monitor all scheduled jobs and their last execution times.

## Cron To Go: An Alternative

<https://devcenter.heroku.com/articles/crontogo>
To overcome the limitations of the Heroku Scheduler, consider exploring alternatives like Cron To Go.

### Features

- **Dashboard**: Offers an extensive job history dashboard.
- **Monitoring**: Provides a grid to monitor job successes and failures, ensuring better visibility.
- **Scheduling Flexibility**: Supports shorter time intervals (as short as 1 minute) compared to Heroku's 10-minute minimum.
- **Migration**: Facilitates easy migration from Heroku Scheduler. However, since we only have one job, this might not be a significant advantage.
- **Granular Control**: Offers more detailed control over scheduling using cron syntax.

In conclusion, while Heroku Scheduler is a straightforward solution, Cron To Go offers more advanced features and flexibility. The choice between them depends on the specific needs and preferences of the project.

## Change Log

- 230901: Authored by Nakul Manchanda (#4200)
