Two step setup:

1. Run terraform script with `terraform apply` (This requires vars ENV_NAME and DIGITALOCEAN_TOKEN)
2. Connect to digital ocean cluster `doctl auth init` and `doctl kubernetes cluster kubeconfig save "$ENV_NAME"`
3. Run argocd manifests with `kubectl apply -n VAULT_APP_NAME externalHelmCharts.yaml` and `kubectl apply -n VAULT_APP_NAME applicationset.yaml`
