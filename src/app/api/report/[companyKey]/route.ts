import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { CompanyReport } from '@/types';

// GET endpoint to fetch a cached report by companyKey (no regeneration)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyKey: string }> }
) {
  try {
    const { companyKey } = await params;

    if (!companyKey) {
      return NextResponse.json(
        { success: false, error: 'Company key is required' },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const docRef = db.collection('reports').doc(companyKey);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const data = docSnap.data();

    // Convert Firestore timestamps to dates
    const report: CompanyReport = {
      id: docSnap.id,
      companyKey: data?.companyKey || companyKey,
      company: data?.company,
      analysis: {
        ...data?.analysis,
        lastUpdated: data?.analysis?.lastUpdated?.toDate?.() || new Date(data?.analysis?.lastUpdated),
      },
      createdAt: data?.createdAt?.toDate?.() || new Date(data?.createdAt),
      updatedAt: data?.updatedAt?.toDate?.() || new Date(data?.updatedAt),
      searchCount: data?.searchCount || 0,
      generatedBy: 'cache',
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Report fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch report'
      },
      { status: 500 }
    );
  }
}
