# Setup infra
1. `terraform init` to install providers (Only needs to be run once)
2. `terraform apply` (This requires vars ENV_NAME and DIGITALOCEAN_TOKEN)
3. Connect aws cluster `aws eks update-kubeconfig --name commonwealth-${ENV_NAME} --region ${AWS_REGION}`
### Note on destroy
If you destroy without first deleting the ingress-nginx Application, you will leave a dangling load balancer
which will prevent the VPC from being deleted.
In this scenario you would need to manually delete the load balancer for full cleanup.

# Bootstrap Argocd
1. `kubectl create namespace argocd && helm install argocd argo/argo-cd --version 8.1.2 --namespace argocd` (requires installing helm locally)

# Setup nginx ingress
1. `kubectl apply -f ingress-nginx.yaml`

# Setup cert-manager
1. `kubectl apply -f cert-manager/cert-manager.yaml`
2. `kubectl create secret generic cloudflare-secrets \
   --namespace cert-manager \
   --from-literal CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}`
3. `kubectl apply -f cert-manager/certificate-nginx.yaml`
3. `kubectl apply -f cert-manager/certificate-vault.yaml`
5. Wait for `kubectl get certificate -n ingress-nginx` to be in READY true

# Setup cloudflare-tunnel
1. `kubectl apply -f cloudflare-operator/cloudflare-operator.yaml`
2. `kubectl create secret generic cloudflare-secrets \
   --namespace cloudflare-operator-system \
   --from-literal CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}`
3. `kubectl apply -f cloudflare-operator/cluster-tunnel.yaml`
4. `kubectl apply -f cloudflare-operator/tunnel-binding.yaml`

# Apply Ingress to argocd
1. `kubectl apply -f argocd/ingress-argocd.yaml`
If you get an error like `tls: failed to verify certificate: x509: certificate signed by unknown authority`
Then run:
`CA=$(kubectl -n ingress-nginx get secret ingress-nginx-admission -ojsonpath='{.data.ca}')
kubectl patch validatingwebhookconfigurations ingress-nginx-admission --type='json' -p='[{"op": "add", "path": "/webhooks/0/clientConfig/caBundle", "value":"'$CA'"}]'`
To copy the cabundle from the secrets into the webhook and reapply the manifest.

Now check to see if argocd subdomain is created, for example argocd.unique.rocks

# Setup vault
1. `kubectl apply -f vault/vault-operator.yaml`
2. `kubectl apply -f vault/vault-application.yaml`

# Get root token and setup initial secrets
1. `export VAULT_ADDR=https://vault.<domain_name>`
2. `./vault/setup/decode_root_token <key-id>`
3. `Ensure base secrets are in .env in the vault/setup/ folder`
4. `./vault/setup/push_env_to_vault`

# Setup external-secrets-operator
1. `kubectl apply -f external-secrets-operator.yaml`
2. `kubectl create secret generic vault-token \
  --from-literal=token='<vault-token>' \
  -n external-secrets`
3. `kubectl apply -f cluster-secrets-store.yaml`
4. `kubectl apply -f reloader.yaml`