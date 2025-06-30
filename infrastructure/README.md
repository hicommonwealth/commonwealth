Two step setup:

# Setup infra
1. Run `terraform init` to install providers (Only needs to be run once)
2. Run terraform script with `terraform apply` (This requires vars ENV_NAME and DIGITALOCEAN_TOKEN)
3. Connect to digital ocean cluster `doctl auth init` and `doctl kubernetes cluster kubeconfig save "$ENV_NAME"`

# Bootstrap OLM
1. Run `kubectl apply -f namespaces.yaml` to create the required namespace
2. Run `helm install my-argo-cd argo/argo-cd --version 8.1.2` (requires installing helm locally)

# Bootstrap OLM
1. `curl -L -s https://github.com/operator-framework/operator-controller/releases/download/v1.3.0/install.sh | bash -s`
2. Run `kubectl apply -f namespaces.yaml`
Refer to Here `https://github.com/operator-framework/operator-controller/tree/main/docs/tutorials`
if you need to add/update/remove extensions

# Set up Argocd
1. `kubectl apply -f argocd-olm.yaml -n argocd`
2. `kubectl apply -f argocd-app.yaml -n argocd`
3. Get initial admin password `kubectl get secret argocd-cluster -n argocd -o json | jq -r '.data["admin.password"]' | base64 --decode`



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
