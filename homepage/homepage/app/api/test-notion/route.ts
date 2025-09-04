import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const notionToken = process.env.NOTION_TOKEN;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;
  
  console.log('Testing Notion integration...');
  console.log('NOTION_TOKEN:', notionToken ? 'present' : 'missing');
  console.log('NOTION_DATABASE_ID:', notionDatabaseId ? 'present' : 'missing');
  
  if (!notionToken || !notionDatabaseId) {
    return NextResponse.json({
      error: 'Notion credentials not configured',
      notionToken: !!notionToken,
      notionDatabaseId: !!notionDatabaseId
    }, { status: 400 });
  }

  try {
    // Test the Notion API by fetching the database
    const response = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API error:', response.status, errorText);
      return NextResponse.json({
        error: `Notion API error: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const database = await response.json();
    console.log('Successfully connected to Notion database:', database.title?.[0]?.plain_text || 'Unknown');
    
    return NextResponse.json({
      success: true,
      databaseName: database.title?.[0]?.plain_text || 'Unknown',
      databaseId: notionDatabaseId
    });
  } catch (error) {
    console.error('Error testing Notion integration:', error);
    return NextResponse.json({
      error: 'Failed to connect to Notion API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
