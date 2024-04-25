# Custom Domains

## Contents

- [Local Testing](#local-testing)
- [Staging Testing](#staging-testing)
- [Heroku](#heroku)
- [Airplane (default method for prod)](#airplane-default-method-for-prod)
- [Workflow](#workflow)
- [External Dependencies](#external-dependencies)
- [Change Log](#change-log)

## Local Testing

Configure a `Chain` in the database to use a custom domain (via the `custom_domain` column) at `whateveryouwant.com`.

Add an entry to /etc/hosts:

```txt
127.0.0.1 whateveryouwant.com
```

Run a local SSL proxy:

```bash
npm install -g local-ssl-proxy
local-ssl-proxy --source 443 --target 8080
```

Go to <https://whateveryouwant.com> and verify that it loads as expected (you might need to bypass the cert restrictions).

## Staging Testing

1. In heroku, for some staging environment create a custom domain for [custom-domain]

2. In the DNS manager for [custom-domain], add a CNAME to point it to the staging environments custom domain

3. Run ```heroku pg:psql --app=[staging-environment-name] -c "update \"Chains\" set custom_domain = '[custom-domain]' where id = '[chain-to-test]'"```

## Heroku

1. Go to Heroku > settings > custom domain section
1. get [whatever].herokudns.com ⇒ then "use wherever"
1. (must) wait for ACM status to be “ready or green check”
1. if that’s taking a while, just delete the record, and re add it (the use Let’s Encrypt)
1. it may take some time

## Airplane (default method for prod)

Airplane has a [task](https://app.airplane.dev/runbooks/rbk20220809zm9b1vxoi7e) set up to automate the process of adding a custom domain in 3 stages.

1. Updates the Chain entry to reflect the new custom domain.
2. Hit heroku /domains endpoint, which spins up a DNS target and is returned to the airplane user. At this step, the DNS target must be shared with the customer and a confirmation that they have added a CNAME record must be obtained.
3. Refreshes the Heroku ACM via the heroku CLI. This is manually performed after step 2 is complete.

## Workflow

1. A DNS target is made for the custom domain in heroku.
2. The domain is put in the "Chains" table under the custom_domain column
3. When a client makes a request to the custom domain, our customDomainRoutes.tsx routes paths to not need the scope, passes scope into the component

## External Dependencies

When adding a new custom domain, ensure you update the following external whitelists:

- For Login: magic.link
- For Chain Data: alchemy.com (ETH mainnet) or quicknode.com (BSC, Fantom)

## Change Log

- 240415: Flagged by Graham Johnson as possibly obsolete in light of abandoning Airplane.
- 230515: Updated with Staging Testing section by Kurtis Assad
- 230321: Updated with Airplane section by Alex Young
- 230227: Authored by Jake Naviaski.
