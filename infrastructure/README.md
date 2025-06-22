Two step setup:

# Setup infra + argocd
1. Run `terraform init` to install providers (Only needs to be run once)
2. Run terraform script with `terraform apply` (This requires vars ENV_NAME and DIGITALOCEAN_TOKEN)
3. Connect to digital ocean cluster `doctl auth init` and `doctl kubernetes cluster kubeconfig save "$ENV_NAME"`
4. Run `./olmBootstrap.sh`

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
