# Analytics Setup Guide

This guide will help you set up trip analytics tracking using Netlify Functions and Neon database.

## Overview

The analytics system tracks three types of events:

- **Trip Generated**: When a user generates an itinerary using AI
- **Trip Saved**: When a user downloads their itinerary as JSON
- **Trip Exported**: When a user exports their itinerary as PDF

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Neon Account**: Sign up at [neon.tech](https://neon.tech) (free tier available)

## Setup Instructions

### 1. Create Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Click "Create Project"
3. Choose a project name (e.g., "travel-itinerary-analytics")
4. Select your preferred region
5. Click "Create Project"

### 2. Set Up Database Schema

1. In your Neon project dashboard, click on "SQL Editor"
2. Copy the contents of `db/schema.sql` from this project
3. Paste and execute it in the SQL Editor
4. This will create:
   - `trip_analytics` table
   - Indexes for better performance
   - Views for easy analytics queries

### 3. Get Database Connection String

1. In Neon dashboard, go to "Dashboard" → "Connection Details"
2. Copy the connection string (it looks like):
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
3. Keep this handy for the next step

### 4. Configure Environment Variables

#### For Local Development:

1. Create a `.env` file in the project root:

   ```bash
   cp .env.example .env
   ```

2. Add your Neon database URL:
   ```
   DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

#### For Netlify Production:

1. Go to your Netlify site dashboard
2. Navigate to "Site configuration" → "Environment variables"
3. Add a new variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon connection string
4. Click "Save"

### 5. Install Dependencies

```bash
bun install
```

This will install:

- `pg` - PostgreSQL client
- `@netlify/functions` - Netlify Functions SDK
- `@types/pg` - TypeScript types for pg
- `netlify-cli` - For local development

### 6. Local Development

To test the functions locally:

```bash
bun run dev:netlify
```

This will start:

- Vite dev server (frontend)
- Netlify Functions (backend)

Your app will be available at `http://localhost:8888`

### 7. Deploy to Netlify

#### Option A: Connect Git Repository (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your Git provider and select your repository
5. Netlify will auto-detect settings from `netlify.toml`
6. Add the `DATABASE_URL` environment variable (see step 4)
7. Click "Deploy"

#### Option B: Manual Deploy

```bash
# Build the project
bun run build

# Deploy using Netlify CLI
netlify deploy --prod
```

## API Endpoints

Once deployed, you'll have these endpoints:

### Track Event

```
POST /.netlify/functions/track-event
```

Request body:

```json
{
  "eventType": "generated|saved|exported",
  "tripDestination": "Tokyo",
  "tripDays": 7,
  "tripBudget": 2000,
  "sessionId": "optional-session-id"
}
```

### Get Analytics

```
GET /.netlify/functions/get-analytics?days=30
```

Response:

```json
{
  "success": true,
  "period": "30 days",
  "stats": {
    "generated": 150,
    "saved": 85,
    "exported": 42
  },
  "total": 277,
  "daily": [...]
}
```

## Database Queries

### View All Events

```sql
SELECT * FROM trip_analytics ORDER BY created_at DESC LIMIT 100;
```

### Get Summary by Event Type

```sql
SELECT * FROM trip_analytics_summary;
```

### Get Daily Statistics

```sql
SELECT * FROM daily_stats;
```

### Get Stats for Last 7 Days

```sql
SELECT
    event_type,
    COUNT(*) as count,
    AVG(trip_budget) as avg_budget
FROM trip_analytics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_type;
```

## Monitoring

### Check Function Logs

1. Go to Netlify dashboard
2. Navigate to "Functions"
3. Click on a function to see logs and invocations

### Query Database

1. Go to Neon dashboard
2. Open "SQL Editor"
3. Run analytics queries to understand user behavior

## Cost Considerations

### Neon (Free Tier)

- 0.5 GB storage
- 1 compute hour per month (scales to zero when idle)
- Perfect for small to medium traffic

### Netlify (Free Tier)

- 125k function invocations/month
- 100 GB bandwidth
- Plenty for most projects

## Troubleshooting

### Functions Not Working Locally

1. Make sure you're using `bun run dev:netlify` not just `bun dev`
2. Check that `.env` file exists with `DATABASE_URL`

### Database Connection Issues

1. Verify connection string is correct
2. Check that SSL mode is enabled: `?sslmode=require`
3. Ensure Neon project is active (not suspended)

### CORS Errors

The functions include CORS headers. If you still see errors:

1. Check browser console for specific error
2. Verify function is being called with correct URL
3. Check Netlify function logs for server-side errors

## Next Steps

Want to add more features?

1. **User Authentication**: Track which users generate trips
2. **Advanced Analytics**: Add destination popularity tracking
3. **Dashboard**: Create an admin dashboard to view analytics
4. **Webhooks**: Send events to other services (Slack, Discord, etc.)

## Support

- **Neon Docs**: https://neon.tech/docs
- **Netlify Functions**: https://docs.netlify.com/functions/overview/
- **PostgreSQL**: https://www.postgresql.org/docs/

---

**Note**: Never commit your `.env` file. It's already in `.gitignore`.
