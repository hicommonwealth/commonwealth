secrets = [
  {
    name        = "sample-secret"
    target_name = "my-app-secret"
    data = [
      {
        secretKey = "my-secret-key"
        remoteRef = {
          key      = "<VAULT_SECRET_PATH>" # <-- Set the Vault secret path here
          property = "<SECRET_PROPERTY>"   # <-- Set the property name in Vault
        }
      }
    ]
  },
] 