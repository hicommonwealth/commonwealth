#!/bin/sh
if [ "$1" == "" ]; then
    echo 'Must supply an argument'
elif [ "$1" == "--deploy-start-production" ]; then
    curl -X POST --data-urlencode "payload={\"channel\": \"#eng-notifications\", \"username\": \"deploybot\", \"text\": \"Started production deploy for `basename $(git remote get-url origin) | sed s/\.git//` (`git rev-parse --short HEAD`) from `hostname`.\", \"icon_emoji\": \":postal_horn:\"}" https://hooks.slack.com/services/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
elif [ "$1" == "--deploy-start-staging" ]; then
    curl -X POST --data-urlencode "payload={\"channel\": \"#eng-notifications\", \"username\": \"deploybot\", \"text\": \"Started staging deploy for `basename $(git remote get-url origin) | sed s/\.git//` (`git rev-parse --short HEAD`) from `hostname`.\", \"icon_emoji\": \":postal_horn:\"}" https://hooks.slack.com/services/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
elif [ "$1" == "--deploy-success" ]; then
    curl -X POST --data-urlencode "payload={\"channel\": \"#eng-notifications\", \"username\": \"deploybot\", \"text\": \"Deploy completed for `basename $(git remote get-url origin) | sed s/\.git//`.\", \"icon_emoji\": \":postal_horn:\"}" https://hooks.slack.com/services/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
elif [ "$1" == "--deploy-fail" ]; then
    curl -X POST --data-urlencode "payload={\"channel\": \"#eng-notifications\", \"username\": \"deploybot\", \"text\": \"Deploy failed for `basename $(git remote get-url origin) | sed s/\.git//`.\", \"icon_emoji\": \":postal_horn:\"}" https://hooks.slack.com/services/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
elif [ "$1" == "--deploy-cancel" ]; then
    curl -X POST --data-urlencode "payload={\"channel\": \"#eng-notifications\", \"username\": \"deploybot\", \"text\": \"Deploy aborted for `basename $(git remote get-url origin) | sed s/\.git//`.\", \"icon_emoji\": \":postal_horn:\"}" https://hooks.slack.com/services/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
else
    echo 'Invalid notification'
fi
