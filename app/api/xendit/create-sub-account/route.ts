import { NextRequest, NextResponse } from 'next/server';

const XENDIT_API_KEY = process.env.XENDIT_SECRET_KEY;
const XENDIT_BASE_URL = 'https://api.xendit.co';

interface CreateSubAccountRequest {
  email: string;
  given_name: string;
  family_name: string;
  type: 'INDIVIDUAL' | 'BUSINESS';
}

export async function POST(request: NextRequest) {
  try {
    if (!XENDIT_API_KEY) {
      return NextResponse.json(
        { error: 'Xendit API key not configured' },
        { status: 500 }
      );
    }

    const body: CreateSubAccountRequest = await request.json();
    const { email, given_name, family_name, type } = body;

    // Create sub-account via Xendit API
    const response = await fetch(`${XENDIT_BASE_URL}/v2/accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${XENDIT_API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        given_name,
        family_name,
        type,
        public_profile: {
          business_name: `${given_name} ${family_name}`.trim()
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Xendit API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create sub-account', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      id: result.id,
      email: result.email,
      status: result.status,
      public_profile: result.public_profile
    });

  } catch (error) {
    console.error('Error creating Xendit sub-account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










