## The Golden Rules (Entry TLDR) 
1. Whatever you are working on must have a story in Github set to "In Progress" stage. 
2. All In Progress stories must be assigned points (i.e. story must be assigned points before being moved to "In Progress").
3. Do no move any stories out of our Backlog (or No Status) label yourself. 

## Commonwealth Development Process
1. We are "doing" Agile, as we say. We have not said we are following either scrum or XP. 
2. We do have team standups on Tuesdays (12:00 ET) and Thursdays (13:00 ET). 
3. Slack nag bot runs every day asking for your update in Slack, don't fall for it. 
4. Daily standups have not been ruled out, but 2 days/week currently serving its purpose. 
5. Please try not to have multiple stories labelled In Progress at the same time. (Work on one thing to completion; if blocked add "blocked" label and then move on to next item.) TBC: If you have multiple stories under In Progress, all but 1 should have blocker label added.  

## How to use / **How we use** Github / Pull Requests
1. When you start working on a ticket move it to in progress (Seems obvious but you'd be surprised) 
2. Always make sure issue has point label when you start it. (Or, to avoid race conditions, before you start it.)
3. The associated branch name should be the Github issue number, prepended to your name and followed by the title slug. 
4. When you create PR, add issue # to PR (under development) which should automagically move your card on the board (as well as other useful side effects.) 
5. NB. If you do not link to the issue your PR closes, the automation system will convert your PR to a draft. There is of course an easy solution for that; link your PR to the in-progress issue it closes. 

### Story Point Estimation
1. We use Fibonacci points, i.e. 1, 2, 3, 5, 8, 13. (See [dedicated section](#fibonacci-points).)
2. Stories of any point value *may* be broken out into subtasks.
3. Stories of more than 3 points *must* be broken out into subtasks.
4. Please add point estimations to your stories before moving them to In Progress. (Even better if you can have stories estimated while Teed Up.)
6. When you complete the work, if original estimation was off, do not mutate it in place. Instead, add the correct estimation as a comment to the issue with a short explanation. 

### Blockers
The "blocked" label is the official source of truth as to whether a story is considered blocked. Unless it has such a label, a story should not be considered blocked or referenced as blocked. This is to prevent miscommunication across the team. 

### Standup 
1. Standups are currently M, T (12:00 ET) & Th (13:00) for 15 minutes, followed by the optional parking lot if there are items that need to be discussed. 
2. Please make sure all your stories are up to date before standup and have the correct status. 
3. Remember to associate any PRs your submit with the story it closes (and automation will do the rest) 
4. Please make sure you have your camera on during our short standup 

### Fibonacci Points
NB. Points != Time! Points are an estimate of complexity, not time. Having said that, complexity may roughly map to time, IF there are no other dependencies:
1 point ~= 1-2 hour task (extra small t-shirt)
2 points ~= 1/2 day task (small t-shirt) 
3 points ~= all day task (medium t-shirt)
5 points ~= multiple day task (large t-shirt) 
8 points ~= 1 sprint / 1 week task (XL t-shirt) 
13 points ~= more than a single sprint (XXL t-shirt) 