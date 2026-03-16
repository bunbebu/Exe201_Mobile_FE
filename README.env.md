# Environment Configuration

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your API base URL:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://localhost:8888
   ```

3. For production, update the URL to your production API:
   ```
   EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com
   ```

## Environment Variables

- `EXPO_PUBLIC_API_BASE_URL`: Backend API base URL (default: `http://localhost:8888`)

## Notes

- The `.env` file is gitignored and should not be committed
- Use `.env.example` as a template for other developers
- After changing `.env`, restart the Expo development server
