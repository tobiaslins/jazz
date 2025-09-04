import { NextRequest, NextResponse } from 'next/server';

interface ContactFormData {
    appName: string;
    description: string;
    website: string;
    repo: string;
    preferredCommunication: string;
    handle: string;
    message: string;
}

async function addToNotion(data: ContactFormData) {
  const notionToken = process.env.NOTION_TOKEN;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;
  
  if (!notionToken || !notionDatabaseId) {
    console.warn('Notion credentials not configured');
    return;
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: notionDatabaseId },
        properties: {
          'App Name': {
            title: [
              {
                text: {
                  content: data.appName,
                },
              },
            ],
          },
          'Description': {
            rich_text: [
              {
                text: {
                  content: data.description,
                },
              },
            ],
          },
          'Website': {
            rich_text: [
              {
                text: {
                  content: data.website,
                },
              },
            ],
          },
          'Repo': {
            rich_text: [
              {
                text: {
                  content: data.repo,
                },
              },
            ],
          },
          'Preferred Communication': {
            select: {
              name: data.preferredCommunication,
            },
          },
          'Handle': {
            rich_text: [
              {
                text: {
                  content: data.handle,
                },
              },
            ],
          },
          'Message': {
            rich_text: [
              {
                text: {
                  content: data.message,
                },
              },
            ],
          },
          'Date': {
            date: {
              start: new Date().toISOString(),
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        databaseId: notionDatabaseId,
        url: `https://api.notion.com/v1/pages`
      });
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    console.log('Successfully added to Notion');
  } catch (error) {
    console.error('Error adding to Notion:', error);
    throw error;
  }
}

// async function sendDiscordAlert(data: ContactFormData) {
//   const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
//   if (!discordWebhookUrl) {
//     console.warn('Discord webhook not configured');
//     return;
//   }

//   try {
//     const embed = {
//       title: '🎉 New Contact Form Submission',
//       color: 0x00ff00,
//       fields: [
//         {
//           name: 'Name',
//           value: data.name,
//           inline: true,
//         },
//         {
//           name: 'Email',
//           value: data.email,
//           inline: true,
//         },
//         {
//           name: 'Company',
//           value: data.company || 'N/A',
//           inline: true,
//         },
//         {
//           name: 'Project Type',
//           value: data.projectType || 'General Inquiry',
//           inline: true,
//         },
//         {
//           name: 'Message',
//           value: data.message.length > 1024 
//             ? data.message.substring(0, 1021) + '...' 
//             : data.message,
//           inline: false,
//         },
//       ],
//       timestamp: new Date().toISOString(),
//     };

//     const response = await fetch(discordWebhookUrl, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         embeds: [embed],
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(`Discord webhook error: ${response.statusText}`);
//     }

//     console.log('Successfully sent Discord alert');
//   } catch (error) {
//     console.error('Error sending Discord alert:', error);
//     throw error;
//   }
// }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appName, description, website, repo, preferredCommunication, handle, message }: ContactFormData = body;

    // Basic validation
    if (!appName || !handle || !website || !description) {
      return NextResponse.json(
        { error: 'App name, contact information, website, and description are required' },
        { status: 400 }
      );
    }

    // Handle validation based on preferred communication method
    if (preferredCommunication === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(handle)) {
        return NextResponse.json(
          { error: 'Please provide a valid email address' },
          { status: 400 }
        );
      }
    }

    // Check if integrations are configured
    const hasNotion = process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID;
    // const hasDiscord = process.env.DISCORD_WEBHOOK_URL;

    console.log('Environment check:', {
      hasNotion,
      notionToken: process.env.NOTION_TOKEN ? 'present' : 'missing',
      notionDatabaseId: process.env.NOTION_DATABASE_ID ? 'present' : 'missing',
      databaseIdLength: process.env.NOTION_DATABASE_ID?.length,
      databaseIdFormat: process.env.NOTION_DATABASE_ID?.includes('-') ? 'with-hyphens' : 'no-hyphens'
    });

    if (!hasNotion) {
      // If no integrations are configured, just log the submission
      console.log('Contact form submission (no integrations configured):', {
        appName,
        description,
        website,
        repo,
        preferredCommunication,
        handle,
        message,
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json(
        { message: 'Thank you for your message! We\'ll get back to you soon. (Demo mode - no integrations configured)' },
        { status: 200 }
      );
    }

    // Process the form submission with configured integrations
    await Promise.allSettled([
      addToNotion({ appName, description, website, repo, preferredCommunication, handle, message }),
    //   sendDiscordAlert({ name, email, company, message, projectType }),
    ]);

    return NextResponse.json(
      { message: 'Thank you for your message! We\'ll get back to you soon.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
