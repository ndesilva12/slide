import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

// GET - Fetch global rankings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'both'; // 'support', 'oppose', or 'both'
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({
        success: true,
        data: { support: [], oppose: [] },
      });
    }

    const result: { support: unknown[]; oppose: unknown[] } = {
      support: [],
      oppose: [],
    };

    // Fetch top supported companies
    if (type === 'support' || type === 'both') {
      const supportQuery = db
        .collection('globalRankings')
        .where('supportCount', '>', 0)
        .orderBy('supportCount', 'desc')
        .limit(limit);

      const supportSnapshot = await supportQuery.get();

      // Fetch company details for each
      const supportPromises = supportSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const reportDoc = await db.collection('reports').doc(data.companyKey).get();
        const reportData = reportDoc.exists ? reportDoc.data() : null;

        return {
          companyKey: data.companyKey,
          supportCount: data.supportCount || 0,
          opposeCount: data.opposeCount || 0,
          company: reportData?.company || { name: data.companyKey, id: data.companyKey },
          analysis: reportData?.analysis || null,
        };
      });

      result.support = await Promise.all(supportPromises);
    }

    // Fetch top opposed companies
    if (type === 'oppose' || type === 'both') {
      const opposeQuery = db
        .collection('globalRankings')
        .where('opposeCount', '>', 0)
        .orderBy('opposeCount', 'desc')
        .limit(limit);

      const opposeSnapshot = await opposeQuery.get();

      const opposePromises = opposeSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const reportDoc = await db.collection('reports').doc(data.companyKey).get();
        const reportData = reportDoc.exists ? reportDoc.data() : null;

        return {
          companyKey: data.companyKey,
          supportCount: data.supportCount || 0,
          opposeCount: data.opposeCount || 0,
          company: reportData?.company || { name: data.companyKey, id: data.companyKey },
          analysis: reportData?.analysis || null,
        };
      });

      result.oppose = await Promise.all(opposePromises);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to fetch rankings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}
