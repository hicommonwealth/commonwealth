resource "cloudflare_record" "main_domain" {
  name    = "commonwealth.im"
  proxied = true
  ttl     = 1
  type    = "CNAME"
  value   = "reticulated-sawfish-bscdr3kqond506xt4prxi3wi.herokudns.com"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "terraform_managed_resource_12970ae35e0d7ca8cb2963b701c242e2" {
  name    = "commonwealth-uploads"
  proxied = true
  ttl     = 1
  type    = "CNAME"
  value   = "commonwealth-uploads.s3.us-east-2.amazonaws.com"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "api_subdomain" {
  name    = "api"
  proxied = true
  ttl     = 1
  type    = "A"
  value   = "140.82.10.213"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "bcoin_subdomain" {
  name    = "bcoin"
  proxied = false
  ttl     = 1
  type    = "A"
  value   = "45.63.88.78"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "cosmoshub1_subdomain" {
  name    = "cosmoshub1"
  proxied = false
  ttl     = 1
  type    = "A"
  value   = "207.148.21.39"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "gaia13k1_subdomain" {
  name    = "gaia13k1"
  proxied = false
  ttl     = 1
  type    = "A"
  value   = "140.82.6.34"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "kusama1_subdomain" {
  name    = "kusama1"
  proxied = false
  ttl     = 1
  type    = "A"
  value   = "155.138.220.105"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "ronin-rpc_subdomain" {
  name    = "ronin-rpc"
  proxied = false
  ttl     = 1
  type    = "A"
  value   = "45.77.155.109"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "straightedge_subdomain" {
  name    = "straightedge"
  proxied = false
  ttl     = 1
  type    = "A"
  value   = "155.138.216.114"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "supernova_subdomain" {
  name    = "supernova"
  proxied = false
  ttl     = 1
  type    = "A"
  value   = "45.77.3.74"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "assets_subdomain" {
  name    = "assets"
  proxied = true
  ttl     = 1
  type    = "CNAME"
  value   = "assets.commonwealth.im.s3.amazonaws.com"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "blog_subdomain" {
  name    = "blog"
  proxied = false
  ttl     = 1
  type    = "CNAME"
  value   = "commonwealth.ghost.io"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "bot-admin_subdomain" {
  name    = "bot-admin"
  proxied = true
  ttl     = 1
  type    = "CNAME"
  value   = "encircled-sprout-va78tg22jbzbdrlszast7aby.herokudns.com"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "bot_subdomain" {
  name    = "bot"
  proxied = false
  ttl     = 1
  type    = "CNAME"
  value   = "proxy-ssl.webflow.com"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "docs_subdomain" {
  name    = "docs"
  proxied = false
  ttl     = 1
  type    = "CNAME"
  value   = "hosting.gitbook.io"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "dydx_subdomain" {
  name    = "dydx"
  proxied = true
  ttl     = 1
  type    = "CNAME"
  value   = "objective-collard-crdjtr2q9w50nlmmmivpamy3.herokudns.com"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "dydx_qa_subdomain" {
  name    = "dydx.qa"
  proxied = false
  ttl     = 1
  type    = "CNAME"
  value   = "mechanistic-coast-sf5ykk2x41q4p8v0la7rrmzr.herokudns.com"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "email_gh-mail_subdomain" {
  name    = "email.gh-mail"
  proxied = true
  ttl     = 1
  type    = "CNAME"
  value   = "mailgun.org"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "mainnet_subdomain" {
  name    = "mainnet"
  proxied = true
  ttl     = 1
  type    = "CNAME"
  value   = "bot.commonwealth.im"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "osmosis_qa_subdomain" {
  name    = "osmosis.qa"
  proxied = false
  ttl     = 1
  type    = "CNAME"
  value   = "dry-bobcat-jtd73kdmnadauii50csu0g7w.herokudns.com"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "qa_subdomain" {
  name    = "qa"
  proxied = true
  ttl     = 1
  type    = "CNAME"
  value   = "warm-jicama-gyipuekeamq5u3ei9uuue43q.herokudns.com"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "uploads_test_subdomain" {
  name    = "uploads-test"
  proxied = true
  ttl     = 1
  type    = "CNAME"
  value   = "uploads-test.commonwealth.im.s3.amazonaws.com"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "www_subdomain" {
  name    = "www"
  proxied = true
  ttl     = 1
  type    = "CNAME"
  value   = "commonwealth.im"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "mailserver" {
  name     = "commonwealth.im"
  priority = 5
  proxied  = false
  ttl      = 1
  type     = "MX"
  value    = "alt2.aspmx.l.google.com"
  zone_id  = var.cloudflare_zone_id
}

resource "cloudflare_record" "mailserver_2" {
  name     = "commonwealth.im"
  priority = 5
  proxied  = false
  ttl      = 1
  type     = "MX"
  value    = "alt1.aspmx.l.google.com"
  zone_id  = var.cloudflare_zone_id
}

resource "cloudflare_record" "googlemail_server_3" {
  name     = "commonwealth.im"
  priority = 10
  proxied  = false
  ttl      = 1
  type     = "MX"
  value    = "aspmx3.googlemail.com"
  zone_id  = var.cloudflare_zone_id
}

resource "cloudflare_record" "googlemail_server_1" {
  name     = "commonwealth.im"
  priority = 1
  proxied  = false
  ttl      = 1
  type     = "MX"
  value    = "aspmx.l.google.com"
  zone_id  = var.cloudflare_zone_id
}

resource "cloudflare_record" "googlemail_server_2" {
  name     = "commonwealth.im"
  priority = 10
  proxied  = false
  ttl      = 1
  type     = "MX"
  value    = "aspmx2.googlemail.com"
  zone_id  = var.cloudflare_zone_id
}

resource "cloudflare_record" "mailgun_server_b" {
  name     = "gh-mail"
  priority = 10
  proxied  = false
  ttl      = 1
  type     = "MX"
  value    = "mxb.mailgun.org"
  zone_id  = var.cloudflare_zone_id
}

resource "cloudflare_record" "mailgun_server_a" {
  name     = "gh-mail"
  priority = 10
  proxied  = false
  ttl      = 1
  type     = "MX"
  value    = "mxa.mailgun.org"
  zone_id  = var.cloudflare_zone_id
}

resource "cloudflare_record" "proxy_ssl" {
  name    = "commonwealth.im"
  proxied = false
  ttl     = 1
  type    = "TXT"
  value   = "proxy-ssl.webflow.com"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "gogole_txt" {
  name    = "commonwealth.im"
  proxied = false
  ttl     = 1
  type    = "TXT"
  value   = "v=spf1 include:_spf.google.com ~all"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "google_site_verification" {
  name    = "commonwealth.im"
  proxied = false
  ttl     = 1
  type    = "TXT"
  value   = "google-site-verification=Wr5-VTY9MmNVHE6YFpG3pIS3OkRlKREVfC_8zfxEDj4"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "dmarc" {
  name    = "_dmarc"
  proxied = false
  ttl     = 1
  type    = "TXT"
  value   = "v=DMARC1; p=none; rua=mailto:jake@commonwealth.im"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "gh-mail" {
  name    = "gh-mail"
  proxied = false
  ttl     = 1
  type    = "TXT"
  value   = "v=spf1 include:mg-spf.greenhouse.io ~all"
  zone_id = var.cloudflare_zone_id
}

# Note this is a public key, so it is safe to store
resource "cloudflare_record" "domain_public_key" {
  name    = "k1._domainkey.gh-mail"
  proxied = false
  ttl     = 1
  type    = "TXT"
  value   = "k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzX1/KCNKS6omf9mc8vpv8d/l01zl5GxOL6Vm9/iw/hWPwOWyflO+HyvLlTwobqvg+OgHC8NDixzqcXAHPVL8dfw/BkY/b6LlWYg+To8O+6JvBUuEWabuNFFNlgIBM3ADgV9773/rmpki7KC23yVrwTkVFspTUELmFNVzPQfUTKhQ69iFrPPDGJn7JiaZvusnl+4mOpD1nb7pWzjKbQk/UFNNNTw1HU6ATC0BBIFV84wFo0FDBNqghorb4JWIbzMcty9+ZrLrJZ0dphpCAfzjKZ/KGfYhwtXtpC0btkxZI1NXNyrA8ICGvgxYUi6iB6CyKJJaQJArdp0vY28jcNghlwIDAQAB"
  zone_id = var.cloudflare_zone_id
}

resource "cloudflare_record" "now" {
  name    = "_now"
  proxied = false
  ttl     = 1
  type    = "TXT"
  value   = "QmbBp3gewBFcvnLNHWxCDCAruNPKGCU661R8vNeMAdu1QD"
  zone_id = var.cloudflare_zone_id
}

