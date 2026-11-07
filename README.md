# KeepAlive — personal uptime monitor

A small Next.js dashboard for monitoring **one website that you own or are authorised to check**. There is no dashboard login, registration, admin panel, or in-browser URL form. Set the URL in the source code, deploy your own copy to Vercel, and view its latest health-check result on the homepage.

> Important: scheduled health checks are not genuine visitor traffic and do not guarantee that a hosting provider will keep a service awake. Follow your hosting provider's acceptable-use policy. This project is an uptime monitor, not a traffic generator.

## 1. Configure your website

Open `lib/config.ts` and replace the example URL:

```ts
export const monitoredWebsite = {
  url: "https://example.com",
  intervalMinutes: 10,
};
```

Use a URL you own or have permission to monitor. Supported intervals are 10, 20, 30, and 60 minutes.

## 2. Create a private GitHub storage repository

The dashboard is public, but the GitHub repository that stores the latest check result should be private.

1. Create a private repository, for example `keepalive-data`.
2. Add `data/websites.json` containing:

```json
{
  "websites": []
}
```

3. Create a fine-grained GitHub Personal Access Token restricted to that repository, with **Contents: Read and write** permission.

## 3. Configure environment variables

Copy `.env.example` to `.env.local` for local development and add the GitHub repository details and token. Also create a long random `CRON_SECRET`.

Never commit `.env.local`, your GitHub token, or your cron secret. Add the same variables in Vercel → Project → Settings → Environment Variables.

## 4. Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 5. Deploy to Vercel

Push this project to your own GitHub repository, import it in Vercel, add the environment variables, and deploy.

## 6. Schedule health checks

On cron-job.org, create a GET job for:

`https://YOUR-VERCEL-DOMAIN.vercel.app/api/monitor`

Set it to run every 10 minutes and add this request header:

`Authorization: Bearer YOUR_CRON_SECRET`

The scheduler runs every 10 minutes. The `intervalMinutes` setting controls how often a check is due, so choose 10 minutes or more. The homepage displays the most recently saved result and refreshes that display every minute.

## Change the website later

Edit `url` in `lib/config.ts` and redeploy. No dashboard login or manual website entry is required.

## Notes

- The homepage is public and displays the configured URL and latest status. Anyone who visits it can see that information.
- GitHub storage is intentionally simple for a personal project. It is not designed for high-volume or multi-user production use.
- Keep the GitHub storage repository private and keep all tokens in environment variables.
