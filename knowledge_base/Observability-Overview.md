# Observability Overview

Here are some commonly used types of **observability metrics**:

- **Logs:** Logs are a record of events that happened in a system. They are often used to understand what has happened historically. Logs typically contain details about an event, such as when the event occurred and what triggered the event.

- **Metrics:** Metrics are numeric representations of data measured over intervals of time. They are typically aggregated and stored in a time-series database. Examples of metrics include counters (like the number of requests handled by a server), gauges (like the current amount of memory used), and histograms (like the distribution of request sizes).

- **Traces:** Tracing captures the lifecycle of a request as it travels through various components of a distributed system. This includes details about the work done in the system such as latency, status, annotations, and more.

- **Events:** Events are a discrete record of something that happens at a point in time. Unlike logs, which are typically created by a system to record its state, events are typically created by humans or algorithms to record a significant occurrence.

- **Health Checks:** These are simple checks to see if a service or system is available and responding. They're often used in monitoring or alerting systems to identify when a system has failed or is under heavy load.

- **Profiling:** Profiling is the practice of monitoring a program or system in operation, especially in order to find areas of code that consume many resources, such as CPU or memory, and could be optimized.

- **Error tracking:** Error tracking is used to monitor and resolve errors. It collects data on errors as they occur in real-time, and allows developers to understand the conditions under which the error occurred, helping them to prevent the error from happening again.

- **Synthetic Monitoring:** Synthetic monitoring (also known as active monitoring) is a method where scripted user flows are monitored at regular intervals to check system availability and performance.

## Change Log

- 230531: Authored by Nakul Manchanda.
