# Ways of Working

_Throughout this page, "ticket" and "story" are used interchangeably to refer to GitHub issues._

## Contents

- [Development Process Overview](#development-process-overview)
- [Project Management Flow](#project-management-flow)
  * [Tickets](#tickets)
    + [Questions](#questions)
    + [Blockers](#blockers)
    + [Story Point Estimation](#story-point-estimation)
  * [Writing Pull Requests](#writing-pull-requests)
    + [Linking Issues](#linking-issues)
    + [Draft PRs](#draft-prs)
    + [Github Quality Checks](#github-quality-checks)
  * [Reviewing Pull Requests](#reviewing-pull-requests)
- [Sprint Cadence](#sprint-cadence)
  * [Standup Meetings](#standup-meetings)
  * [Deep Work Wednesdays](#deep-work-wednesdays)
  * [Friday Meetings](#friday-meetings)
- [Agile Release Schedule](#agile-release-schedule)
  * [Release and Deploy Procedure](#release--deploy-procedure)
- [Change Log](#change-log)

## Development Process Overview

1. We follow an Agile work philosophy. See [Agile Manifesto](https://agilemanifesto.org/) for context.
2. We track work through GitHub's project board, using tickets' "Project" metadata. See [Project Management Flow](#project-management-flow) for full context.
3. We use team standups to sync up on project status and share updates. Standups take place on Mondays, Tuesdays, and Thursdays at 12:00 EST. See [Standup Meetings](#standup-meetings) section for full context.
4. Informally, we are divided into three teams. The Product team builds and maintains our UI; the Platform team is responsible for backend and business logic; and the Protocol team handles smart contracts.

## Project Management Flow

All work must be associated with a ticket, and the ticket must be opened before its respective pull request (as we use automated software which relies on this precedence).

You must not change the title or description of someone else's Github story or PR without permission.

### Tickets

Engineers are welcome to open up new tickets. These should be set to "No Status," for the current work cycle (e.g. "Cycle 6"). This can be done either in the ticket's "projects" metadata (found in the right-hand side bar when opening a new GitHub issue), or from within the relevant [sprint board](https://github.com/orgs/hicommonwealth/projects/).

Next, a ticket is "Teed Up" (moved to the "Teed Up" stage) by a lead or project manager. An engineer who wishes for a ticket to be Teed Up should DM the relevant lead/PM. Only leads Tee Up tickets.

Work should not begin on a ticket until (1) an engineer has been assigned to the ticket by a lead (2) the engineer has given the ticket a [story-point value](#story-point-estimation) (3) the engineer has moved the ticket to "In Progress."

Typically, engineers should only be working on one "In Progress" ticket at a time. If blocked, apply the "blocked" project label and move on to next Teed-Up item (which should now be moved to "In Progress").

#### Triage

Tickets for bugs are flagged P0 through P4 (i.e. "priority zero" through "priority four"):

- P0: Considered critical, demanding immediate attention. Reserved for company-threatening issues.
- P1: Should be fixed day-of report. Reserved for bugs affecting large groups of users.
- P2: Should be fixed week of report. Typically reserved for bugs affecting small groups of users.
- P3: Should be fixed within two weeks of report. Typically reserved for minor user inconveniences.
- P4: Backlogged and fixed as convenient.

A "high priority" label may also be added by leads to teed-up feature tickets; these tickets should jump the queue and be worked on next.

#### Questions

If an implementing engineer has questions about a ticket, these should be left as a comment on the GitHub issue itself (rather than in Slack DMs, where the record will be buried).

Questions must tag a specific individual. Typically, they should only tag one person, since multi-tags frequently lead to responsibility deferrals (i.e. each tagged individual assumes the other has it covered).

#### Blockers

The "blocked" label is the official source of truth as to whether a story is considered blocked. Unless it has such a label, a story should not be considered blocked or referenced as blocked. This is to prevent miscommunication across the team.

#### Story Point Estimation

1. You must add point estimations to your stories before moving them to "In Progress." (Even better if you can have stories estimated while "Teed Up.")
2. We use Fibonacci points, i.e. 1, 2, 3, 5, 8, 13. (See below for full breakdown of point values.)
3. Stories of any point value may be broken out into subtasks.
4. Stories of more than 3 points must be broken out into subtasks.
5. Stories may be broken into _independent_ and _dependent_ sub-tasks, and should be flagged accordingly, to prevent blocked work.
6. When you complete the work, if the original estimation was off, do not mutate it in place. Instead, add the correct estimation as a comment to the issue with a short explanation.

NB. Points != Time! Points are an estimate of complexity, not time. Having said that, complexity may roughly map to time, IF there are no other dependencies:

- 1 point ~= 1-2 hour task
- 2 points ~= 1/2 day task
- 3 points ~= all-day task
- 5 points ~= multi-day task
- 8 points ~= 1 sprint / 1-week task
- 13 points ~= more than a single sprint

Points may always be increased mid-implementation, but a justification must be provided. Moreover, the original point estimation _must_ be left as a tag, rather than deleted.

### Branches

Branches should be prefixed with an issue number, then the contributor's name, followed by a short descriptive tag e.g. `5007.john-doe.update-sidebar-layout`.

### Writing Pull Requests

If a PR is marked for review, it must be fully mergeable, without breaking any existing functionality. It should also pass CI and [GitHub Quality Checks](#github-quality-checks).

PR descriptions should concretely describe how the introduced code changes resolve the instigating ticket. Orienting information should be provided so that a developer lacking extensive contextual knowledge of the codebase area is nonetheless able to review the code. As of 230906, test plans should be included with every code-changing PR, as part of our road to automated testing. PR descriptions should be sufficient for a developer without extensive contextual knowledge of this area to review the code.

Help close your own PRs: if it's ready for QA, tag a reviewer, complain in a Slack channel, or send a DM.

#### Linking Issues

PRs must always link to their instigating ticket. GitHub uses [a set of keywords](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) to automatically link a PR to referenced issues. Alternatively, PRs may be manually linked via their "Development" sidebar section.

Linked issues are automatically closed by their relevant PRs. In some exceptional cases—for instance, when referencing the outstanding Documentation Update Ticket (#4800)—GitHub closing keywords should be omitted so as to keep the instigating ticket open when the PR is closed.

Engineers are welcome to open several pull requests to close an outstanding ticket. Such PRs can be either "dependent" (i.e., blocking) or "sequential" (i.e., logically independent), and should be flagged accordingly, so that depended-upon (i.e. blocking) PRs are prioritized for merging.

#### Draft PRs

PRs that are not yet ready for Codeowner Review should be opened as drafts. Drafts should typically include some estimation of when review-ready code is expected to land.

If a non-draft PR is assessed by a codeowner as not yet ready for review, or needing further work, it should be reassigned draft status.

In the case of a Design Review (not to be confused with a Codeowner Review), any feedback that isn't unambiguously positive should result in status changing back to draft for remaining work.

#### Github Quality Checks

Pull requests to Master should pass Github's code quality checks. (Nb: Not the test suite run by our CI, but those quality checks identified in the PR's `files/diff`.) PR authors should resolve these checks themselves.

Any pull requests originating in the experimental branch, and being merged into Master, must pass all code quality checks. PR authors must resolve these checks themselves.

Occasionally, quality checks will erroneously flag code which is used throughout our codebase, such as `useEffect`. These can be ignored.

### Reviewing Pull Requests

Any engineer on the team may (and is encouraged to!) review a PR. Two approvals are required to merge to master.

Occasionally reviewers may be assigned by a lead or PR author, using the `assignee` field, but we are hopeful that a volunteer culture will be sufficient.

## Sprint Cadence

Sprints are grouped into 2 cycles of 6 one-week sprints per business quarter, plus an extra sprint that can either fall between the 2 cycles, or come at the end of the quarter.

Standup meetings are held Mondays, Tuesdays, and Thursdays. Wednesdays are intended for deep work, and should not be used to schedule lengthy or recurring meetings. Fridays are used to review the past week's work, and to plan for the following week's sprint.

### Standup Meetings

1. Standups are currently M, T, & Th at 12:00 EST for 15 minutes, followed by an optional 15 minute "parking lot" if there are further items that need discussing.

2. Please make sure all your stories are up-to-date before standup, and have the correct project state (Teed Up, In Progress, etc).
    - Remember to associate any PRs you submit with the ticket it closes (and automation will do the rest).

3. When you give your standup, try to stay concise, providing a general status update for various tickets, and briefly flagging any complications.

    - Tickets and PRs should be referenced by both their assigned numbers (e.g. "#4572") and their descriptive titles.

    - All complications can be handled in parking lot (or "p-lot"). We bracket them in the main standup session to keep the call short and sweet for engineers.

4. The purpose of standup is to keep your fellow team members (both engineers and leads) informed. Standups should be given in this spirit, addressing the team broadly, and ensuring that enough contextual information is provided that your colleagues can follow along.

5. Please keep your camera on whenever possible, and ensure you are in a relatively quiet space with clear audio quality.

### Deep Work Wednesdays

Wednesdays are intended to be deep focus days, so recurring or long meetings are not scheduled for Wednesday. This your chance to work uninterrupted on your sprint stories.

### Friday Meetings

We try to keep all our regular 1:1's on Friday, the final day of the sprint. Our stated goal is to have sprint stories mostly completed by the Weekly Retro, which takes place every Friday at 12:00 (and where appropriate, demo things that were shipped at the the retro meeting for all to see).

Later on Friday we have our Sprint Planning meeting where we tee up the stories we want to include in the next week's sprint. This is not a meeting the full team needs to attend; however, the goal is to have the following week's scope worked out by the end of the previous sprint.

## Agile Release Schedule

We cut releases for hot fixes and new product features on independent schedules. Hot fixes (fixes for bugs flagged P0 through P2) are released on a rolling, ad hoc basis. New product releases are cut Thursday at 2pm EST, so that new features can be announced by the Growth team Monday morning.

Leads cut release branches which are manually pushed to our Beta (QA) server for review. A working session (or "PR Party") may be held to ensure all shippable code will be included in the next day's release. Currently, Product team is responsible for QA'ing new releases on Beta. Engineering is responsible for informing Product that release on Beta is ready for QA. Effectively, this means everything that is ready for QA that day has been deployed to Beta.

Our Beta/QA server can be found at `qa.commonwealth.im`. Custom domains are available at `osmosis.qa.commonwealth.im` and `dydx.qa.commonwealth.im`.

As of 230831, we have hired a QA Engineer who will begin taking on QA work as well as executing the automation plan; expect this part of the process to be in flux.

### Release & Deploy Procedure

We use [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) for both feature releases and hotfixes. Releases are bundles of commits organized as tags. Git tags are similar to git branches, insofar as they are versions of the repository, containing a specific iteration in the repo’s history, which may be checked out locally. As of 240111, tags are created from dedicated release branches.

Releases must first be created, then QA’d, then deployed to Heroku. All engineers ought, by default, to possess the GitHub permissions required to draft a release. All engineers ought, by default, to possess the Heroku admin permissions required to deploy a release. If this is not the case, and permissions are required for the task at hand, reach out to a lead.

The procedure for creating a new GitHub Release from a pre-existing release branch, e.g. `release/v0.6.9`, is:

1. Navigate to the [repo’s Releases page](https://github.com/hicommonwealth/commonwealth/releases).
2. Select "Draft a new release."
3. In the "Choose a tag" dropdown, create and select a new tag, following the versioning syntax described [below](#release-names-and-tags).
4. Select the relevant release branch as the tag's target.
5. Title the release after its version number (e.g. `v0.6.9`; see [below](#release-names-and-tags) for naming schema).
6. Before hitting the "Generate release notes" button, manually set the "Previous tag" to the latest deployed version, e.g. `v0.6.8`.
7. Now hit “Generate release notes” to auto-populate the release description with a list of changes since the previous tag.
8. Check “Set as a pre-release,” at the bottom of the form.
9. Publish.

Procedure for QAing a GitHub release:

1. The tag is manually pushed to our Beta (QA) server, which is pegged to release versions.
2. QA must either approve or reject these changes.
3. If QA finds significant issues with the branch, it will be rejected, and QA must open a GitHub issue enumerating the desired changes.
    + A leads retro should be held to understand what went wrong in the product-and-engineering pipeline, to prevent similar problems in the future.
4. If QA finds minor issues with the branch, they may still approve it, but must similarly open a GitHub issue enumerating the desired changes.
    + These changes should be addressed before the next release.

Procedure for deploying a GitHub release:

1. Once QA has approved the changes, the release can be deployed
2. `git push heroku <FullVersionTagname>:master`, e.g. `git push heroku v0.6.9:master`
3. If the tag is not found, run `git fetch origin`
4. If the git remote for Heroku doesn’t exist, run `heroku git:remote —app commonwealthapp`
5. Upon deploy, edit the original GitHub release, moving it from “pre-release” to “latest release”

#### Release names and tags

Tag names observe the following versioning syntax: `v<MajorVersion>.<CycleNumber>.<IndexNumber>`. As of 240111, our major version is 0, our cycle number is 6, and our index number is 9, thus: `v0.6.9`. For hotfixes to an existing release, an additional suffix should be appended after a hyphen, e.g. `v0.6.9-1`.

Release branches also follow this syntax, but prepend `release/` and append `-x`, e.g. `release/v0.6.9-x`. The `-x` suffix denotes that the branch contains any hot fix releases for that version.

#### Hotfix procedure

Hotfixes should rolled out to production as follows:

1. The hotfix is pushed directly to the release branch.
2. The release branch is manually pushed to the Beta (QA) server.
3. QA approval is obtained.
4. The hotfix branch is deployed to production.
5. The hotfix branch is merged back into master before the next release is cut.

Alternatively, engineers are welcome to create a new hotfix branch, and cherrypick it into the release branch, replacing steps 1 & 2 above.

## Change Log

- 231016: Updated by Graham Johnson with new "Release & Deploy Procedure" section (#5062).
- 230906: Updated by Graham Johnson with new requirements for tickets and PRs (#4972).
- 230831: Merged with Agile-Development.md by Graham Johnson (#4936) and certified fresh.
- 230823: Migrated from GitHub wiki by Graham Johnson (#4350).
- 230124: Initial stub authored by Forest.
