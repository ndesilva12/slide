import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { CompanyReport } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort') || 'popular'; // 'popular' or 'recent'
    const limitCount = parseInt(searchParams.get('limit') || '50', 10);
    const industry = searchParams.get('industry');
    const leaning = searchParams.get('leaning');

    const { db } = getFirebaseAdmin();

    if (!db) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Database not configured',
      });
    }

    // Build query
    let query = db.collection('reports');
    let orderedQuery;

    if (sortBy === 'popular') {
      orderedQuery = query.orderBy('searchCount', 'desc');
    } else {
      orderedQuery = query.orderBy('updatedAt', 'desc');
    }

    const snapshot = await orderedQuery.limit(limitCount).get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    let reports: CompanyReport[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        companyKey: data.companyKey || doc.id,
        company: data.company,
        analysis: {
          ...data.analysis,
          lastUpdated: data.analysis?.lastUpdated?.toDate?.() || new Date(data.analysis?.lastUpdated),
        },
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        searchCount: data.searchCount || 0,
        generatedBy: data.generatedBy || 'cache',
      } as CompanyReport;
    });

    // Apply client-side filters if needed (Firestore has limited compound query support)
    if (industry && industry !== 'All') {
      reports = reports.filter((r) => r.company.industry === industry);
    }

    if (leaning && leaning !== 'All') {
      reports = reports.filter((r) => r.analysis.overallLeaning === leaning);
    }

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Browse error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch companies',
      },
      { status: 500 }
    );
  }
}
