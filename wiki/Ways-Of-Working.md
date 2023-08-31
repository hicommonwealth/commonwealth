<!-- TODO Graham 230831: Establish a glossary of engineering terms for our wiki. -->
_Throughout this page, "ticket" and "story" are used interchangeably to refer to GitHub issues._

**Contents**
- [Development Process Overview](#development-process-overview)
- [Project Management Flow](#project-management-flow)
  * [Tickets](#tickets)
    + [Blockers](#blockers)
    + [Story Point Estimation](#story-point-estimation)
  * [Pull Requests](#pull-requests)
    + [Github Quality Checks](#github-quality-checks)
- [Standup](#standup)
- [Deployment and QA schedule](#deployment-and-qa-schedule)
- [Change Log](#change-log)

# Development Process Overview

1. We follow an Agile work philosophy.
 See [Agile Manifesto](https://agilemanifesto.org/) for context.
2. We track work through GitHub's project board, using tickets' "Project" metadata. See [Project Management Flow](#project-management-flow) for full context.
3. We use team standups to sync up on project status and share updates. Standups take place on Mondays, Tuesdays, and Thursdays at 12:00 EST. See [Standup](#standup) section for full context.

# Project Management Flow

All work _must_ be associated with a ticket, and the ticket _must_ be opened before its respective pull request (as we use automated software which relies on this precedence).

You _must not_ change the title or description of someone else's Github story or PR without permission. 

## Tickets

Engineers are welcome to open up new tickets. These _should_ be set to "No Status," for the current work cycle (e.g. "Cycle 6"), via the issue's "projects" metadata. Next a ticket is "teed up" (assigned the Teed Up label) by a lead or project manager.

If you would like to tee-up a ticket, DM the relevant lead/PM. Do not move any stories out of our Backlog (i.e., out of the "No Status" label) yourself. 

Work _should not_ begin on a ticket until (1) an engineer has been assigned to the ticket (2) it has been assigned a [story-point value](#story-point-estimation) (3) it has been assigned an "In Progress" status label.

Typically, engineers _should_ only be working on one "In Progress" ticket at a time. If blocked, apply the "blocked" project label and move on to next Teed-Up item (which should now be marked as "In Progress"). 

### Blockers

The "blocked" label is the official source of truth as to whether a story is considered blocked. Unless it has such a label, a story should not be considered blocked or referenced as blocked. This is to prevent miscommunication across the team. 

### Story Point Estimation

1. You *must* add point estimations to your stories before moving them to "In Progress." (Even better if you can have stories estimated while "Teed Up.")
2. We use Fibonacci points, i.e. 1, 2, 3, 5, 8, 13. (See below for full breakdown of point values.)
3. Stories of any point value *may* be broken out into subtasks.
4. Stories of more than 3 points *must* be broken out into subtasks.
5. Stories may be broken into _independent_ and _dependent_ sub-tasks, and should be flagged accordingly, to prevent blocked work.
6. When you complete the work, if the original estimation was off, do not mutate it in place. Instead, add the correct estimation as a comment to the issue with a short explanation. 

NB. Points != Time! Points are an estimate of complexity, not time. Having said that, complexity may roughly map to time, IF there are no other dependencies:
- 1 point ~= 1-2 hour task
- 2 points ~= 1/2 day task
- 3 points ~= all-day task
- 5 points ~= multi-day task
- 8 points ~= 1 sprint / 1-week task
- 13 points ~= more than a single sprint

Points _may_ always be increased mid-implementation, but a justification _must_ be provided.

## Pull Requests

PRs should always reference their instigating ticket in the description, by number.

Engineers are welcome to open several pull requests to close an outstanding ticket. Such PRs can be either "dependent" (i.e., blocking) or "sequential" (i.e., logically independent), and should be flagged accordingly, so that depended-upon (i.e. blocking) PRs are prioritized for merging. 

Close your own PR: if it's ready for QA, tag a reviewer, complain in a Slack channel, or send a DM. 

### Github Quality Checks

Pull requests to Master _should_ pass Github's code quality checks. (Nb: Not the test suite run by our CI, but those quality checks identified in the PR's `files/diff`.) PR authors _should_ resolve these checks themselves.

Any pull requests originating in the experimental branch, and being merged into Master, _must_ pass all code quality checks. PR authors _must_ resolve these checks themselves.

Occasionally, quality checks will erroneously flag code which is used throughout our codebase, such as `useEffect`. These can be ignored.

# Standup

1. Standups are currently M, T, & Th at 12:00 EST for 15 minutes, followed by an optional "parking lot" if there are further items that need discussing. 
2. Please make sure all your stories are up-to-date before standup, and have been assigned the correct status. 
    - Remember to associate any PRs you submit with the ticket it closes (and automation will do the rest).
3. When you give your standup, try to stay concise, providing a general status update for various tickets, and briefly flagging any complications.
    - Tickets and PRs should be referenced by both their assigned numbers (e.g. "#4572") and their descriptive titles.
    - All complications can be handled in parking lot (or "p-lot"). We bracket them in the main standup session to keep the call short and sweet for engineers.
4. The purpose of standup is to keep your fellow team members (both engineers and leads) informed. Standups should be given in this spirit, addressing the team broadly, and ensuring that enough contextual information is provided that your colleagues can follow along.
5. Please keep your camera on whenever possible, and ensure you are in a relatively quiet space with clear audio quality.

# Deployment and QA schedule

Agile Release Trains (aka [ART, from SAFe5](https://v5.scaledagileframework.com/agile-release-train/)) run 4.5 days a week, Monday morning through mid-day Friday. We do not deploy on Fridays after 13:00 EST. If QA has been approved by 13:00, we will ship the release; otherwise we don't ship until Monday.

Over the course of the day, pull requests are merged into the Master branch on an ad hoc basis. On merge, the code is automatically pushed to our Beta (QA) server. Each morning, before the next round of PR merges, Beta ships a new release to the live site. Typically, a working session (aka "PR Party") is held to make sure everything shippable will be included in the next day's release.

Currently, Product team is responsible for QA'ing the day's release on Beta before the following morning. As of 230831, we have hired a QA Engineer who will begin taking on this work as well as executing the automation plan; expect this part of process to be in flux.

Engineering is responsible for informing Product that release on Beta is ready for QA. Effectively, this means everything that is ready for QA that day has been deployed to Beta. 

Our Beta/QA server can be found at `qa.commonwealth.im`.

# Change Log

- 230831: Merged with Agile-Development.md by Graham Johnson (#4936) and certified fresh.
- 230823: Migrated from GitHub wiki by Graham Johnson (#4350).
- 230124: Authored by Forest.