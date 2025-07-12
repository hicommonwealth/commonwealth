Two step setup:

# Setup infra
1. `terraform init` to install providers (Only needs to be run once)
2. `terraform apply` (This requires vars ENV_NAME and DIGITALOCEAN_TOKEN)
3. Connect aws cluster `aws eks update-kubeconfig --name commonwealth-${ENV_NAME} --region ${AWS_REGION}`
### Note on destroy
There is a bug somewhere in one of the providers (probably fck-nat in ha mode) where it does not tear down the load balancer
Until fixed you must manually delete the load balancer after the cleanup and then retry deleting the vpc for full
teardown

# Bootstrap Argocd
1. `kubectl create namespace argocd && helm install argocd argo/argo-cd --version 8.1.2 --namespace argocd` (requires installing helm locally)

# Setup nginx ingress
1. `kubectl apply -f ingress-nginx.yaml`

# Setup cert-manager
1. `kubectl apply -f cert-manager/cert-manager.yaml`
2. `kubectl create secret generic cloudflare-secrets \
   --namespace cert-manager \
   --from-literal CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}`
3. `kubectl apply -f cert-manager/cluster-issuer.yaml`
4. `kubectl apply -f cert-manager/certificate.yaml`
5. Wait for `kubectl get certificate -n ingress-nginx` to be in READY true

# Setup cloudflare-tunnel
1. `kubectl apply -f cloudflare-operator/cloudflare-operator.yaml`
2. `kubectl create secret generic cloudflare-secrets \
   --namespace cloudflare-operator-system \
   --from-literal CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}`
2. `kubectl apply -f cloudflare-operator/cluster-tunnel.yaml`
3. `kubectl apply -f cloudflare-operator/tunnel-binding.yaml`

# Apply Ingress to argocd



# For future development
## If you want to deploy common open source software
In this case you would check the extensions for an operator (see 2nd H1). Then create a namespace, olm, app
for it. 

## If you want to deploy our custom software
In this case you would just create an ArgoCD Application for it

# Setup vault
1. Run the vault manifests `kubectl apply -n argocd vault.yaml`
2. Bootstrap vault unsealing. First `kubectl -n vault exec -it vault-0 sh`
3. Run `vault operator init`. It will print out the root token which you should save, as well as the 5 unseal keys
4. Run `vault operator unseal` and pass in the unseal keys. Repeat this 3 times using a different unseal key each time

## Vault auto-unseal setup
1. `vault login $ROOT_TOKEN` where root token is obtained from previous section
2. `vault secrets enable transit`
3. `vault write -f transit/keys/autounseal`

4. Run argocd manifests with `kubectl apply -n VAULT_APP_NAME externalHelmCharts.yaml` and `kubectl apply -n VAULT_APP_NAME applicationset.yaml`
