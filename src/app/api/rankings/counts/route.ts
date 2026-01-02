import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

// GET - Fetch endorsement/boycott counts for a specific company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyKey = searchParams.get('companyKey');

    if (!companyKey) {
      return NextResponse.json(
        { success: false, error: 'companyKey is required' },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({
        success: true,
        data: { supportCount: 0, opposeCount: 0 },
      });
    }

    // Fetch counts from globalRankings collection
    const rankingDoc = await db.collection('globalRankings').doc(companyKey).get();

    if (!rankingDoc.exists) {
      return NextResponse.json({
        success: true,
        data: { supportCount: 0, opposeCount: 0 },
      });
    }

    const data = rankingDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        supportCount: data?.supportCount || 0,
        opposeCount: data?.opposeCount || 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch company counts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch counts' },
      { status: 500 }
    );
  }
}
