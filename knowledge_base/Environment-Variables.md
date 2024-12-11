# Environment Variables Documentation

## Google Cloud Translation Configuration

### Required Variables
- `GOOGLE_CLIENT_ID`: OAuth2 client ID for Google Cloud Translation API
  - Required for authentication with Google Cloud services
  - Obtain from Google Cloud Console

- `GOOGLE_CLIENT_SECRET`: OAuth2 client secret for Google Cloud Translation API
  - Required for authentication with Google Cloud services
  - Obtain from Google Cloud Console

- `GOOGLE_APPLICATION_CREDENTIALS`: Path to Google Cloud credentials file
  - Default: `~/.config/gcloud/application_default_credentials.json`
  - Contains the Application Default Credentials (ADC) for Google Cloud services
  - Required for server-side translation functionality

### Setup Instructions
1. Create a project in Google Cloud Console
2. Enable Cloud Translation API
3. Create OAuth2 credentials (Client ID and Secret)
4. Set up Application Default Credentials:
   ```bash
   mkdir -p ~/.config/gcloud
   # Create credentials file with OAuth2 credentials
   cat > ~/.config/gcloud/application_default_credentials.json << EOL
   {
     "client_id": "YOUR_CLIENT_ID",
     "client_secret": "YOUR_CLIENT_SECRET",
     "type": "authorized_user",
     "refresh_token": null
   }
   EOL
   ```

### Usage
These credentials are used by the GoogleTranslationService to:
- Translate thread and comment content
- Detect content language
- Support internationalization features
