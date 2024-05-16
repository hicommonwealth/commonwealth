# Custom Domains

## Contents

- [Local Testing](#local-testing)
- [Staging Testing](#staging-testing)
- [Heroku](#heroku)
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
1. Get [whatever].herokudns.com ⇒ then "use wherever". Communicate this with the external client, who must configure it on their side.
1. Wait for ACM status to be “ready or green check”, once configured on external client's DNS provider.
1. If that’s taking a while, just delete the record, and re add it (the use Let’s Encrypt).
1. Once completed, use the admin panel to add the custom domain to the community.

## External Dependencies

When adding a new custom domain, ensure you update the following external whitelists:

- For Login: magic.link
- For Chain Data: alchemy.com (ETH mainnet only)

## Change Log

- 240415: Flagged by Graham Johnson as possibly obsolete in light of abandoning Airplane.
- 230515: Updated with Staging Testing section by Kurtis Assad
- 230321: Updated with Airplane section by Alex Young
- 230227: Authored by Jake Naviaski.
