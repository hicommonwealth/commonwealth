aws kms decrypt --ciphertext-blob fileb://vault-root \
        --region us-east-1 \
        --encryption-context Service=Vault \
        --key-id 2af407d3-75f9-499d-906e-a5a77748fa6c \
        --output text \
        --query Plaintext | base64 -d > vault-root.txt
