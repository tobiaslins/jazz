# Contact Form Setup Guide

This guide explains how to set up the contact form with Notion and Discord integrations.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Notion Integration
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id

# Discord Integration
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

## Notion Setup

### 1. Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name (e.g., "Jazz Contact Form")
4. Select the workspace where you want to create the database
5. Click "Submit"
6. Copy the "Internal Integration Token" - this is your `NOTION_TOKEN`

### 2. Create a Database

1. In your Notion workspace, create a new page
2. Type `/database` and select "Table - Full page"
3. Add the following properties to your database:
   - **Name** (Title) - Required
   - **Email** (Email) - Required
   - **Company** (Text) - Optional
   - **Message** (Text) - Required
   - **Project Type** (Select) - Optional
   - **Date** (Date) - Optional (auto-filled)

### 3. Share the Database

1. Click the "Share" button in the top right of your database
2. Click "Invite" and search for your integration name
3. Select your integration and click "Invite"
4. Copy the database ID from the URL (the part after the last `/` and before the `?`)

## Discord Setup

### 1. Create a Discord Webhook

1. Go to your Discord server
2. Navigate to Server Settings > Integrations > Webhooks
3. Click "New Webhook"
4. Give it a name (e.g., "Jazz Contact Form")
5. Select a channel where you want to receive notifications
6. Click "Copy Webhook URL" - this is your `DISCORD_WEBHOOK_URL`

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `/showcase`
3. Scroll down to the contact form
4. Fill out and submit the form
5. Check your Notion database and Discord channel for the submission

## Troubleshooting

### Notion Issues

- **401 Unauthorized**: Check that your `NOTION_TOKEN` is correct
- **404 Not Found**: Verify your `NOTION_DATABASE_ID` is correct and the integration has access
- **403 Forbidden**: Make sure you've shared the database with your integration

### Discord Issues

- **400 Bad Request**: Check that your webhook URL is valid
- **404 Not Found**: The webhook may have been deleted or the URL is incorrect

### General Issues

- Check the browser console and server logs for error messages
- Verify all environment variables are set correctly
- Ensure your development server is running

## Customization

### Modifying Form Fields

To add or modify form fields:

1. Update the `FormData` interface in `ContactForm.tsx`
2. Add the new field to the form JSX
3. Update the validation logic
4. Modify the API route to handle the new field
5. Update the Notion database properties accordingly

### Styling

The form uses Tailwind CSS classes and follows the Jazz design system. You can customize the styling by modifying the classes in the components.

### Notion Database Schema

If you need to modify the Notion database schema, update the `addToNotion` function in `app/api/contact/route.ts` to match your new properties.
