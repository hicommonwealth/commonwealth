Commonwealth Sprint Cadence

We have Standup on **Mondays** & **Tuesdays** at 12:00 ET, and **Thursdays** at 13:00 ET. 
We aim to complete standup in 15 minutes, and reserve the following 15 minutes in case there are any parking lot items particular team members need to discuss. 

Wednesdays are intended to be deep focus days, so recurring or long meetings are not scheduled for **Wednesday**. This your chance to work uninterrupted on your sprint stories. 

We try to keep all our regular 1:1's on **Friday**, which of course is the last day in the sprint. Our stated goal is to ho have sprint stories mostly completed by the weekly retro, which takes place every Friday at 12:00 (and where appropriate, demo things that were shipped at the the retro meeting for all to see.) 

Later on **Friday** we have our Sprint Planning meeting where we tee up the stories we want to include in the next week's sprint. This is not a meeting the full team needs to attend, however the goal is to have the following week's scope worked out by the end of the previous sprint. 

Sprints are grouped into 2 cycles of 6 sprints each in a quarter plus an extra sprint that can either fall between the 2 cycles, or come at the end of the quarter. 

# Submitting PRs 

Once the story you are working on is ready to be merged into the codebase, put up a Pull Request, making sure to add which story the PR closes (under the development sidebar on the right of the PR page.) If the PR closes multiple stories, even better, however, please do not add 'additional' stories to a PR, but only if a given change resolves multiple issues. 

In general, PRs should be atomic and "as simple as possible (but no simpler)" to quote Einstein [1933] and all open PRs should be fully mergeable without leaving anything in a broken state. 

NB. We are using the new "Unchanged Files Check Annotations" which means that annotations you did not change in your commits has errors and needs to be corrected. Generally these will be unused imports or types that will need to be fixed. As we have repeatedly said WRT code cleanup, if your code is touching something that needs debugging or just makes you unhappy, please fix and include in your PR. 

So, please do catch any errors that are raised in CICD Check Annotations, and resubmit your PR. 