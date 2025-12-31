import { NextRequest, NextResponse } from 'next/server';
import { searchCompaniesAI } from '@/lib/ai-service';
import { searchCompanies } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Try Firestore first for cached companies
    let companies = await searchCompanies(query);

    // If no results from cache, use AI to suggest companies
    if (companies.length === 0) {
      companies = await searchCompaniesAI(query);
    }

    return NextResponse.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      },
      { status: 500 }
    );
  }
}
