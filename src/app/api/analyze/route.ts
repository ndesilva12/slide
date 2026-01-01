import { NextRequest, NextResponse } from 'next/server';
import { analyzeCompany } from '@/lib/ai-service';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { createCompanyKey, daysSince } from '@/lib/company-utils';
import { fetchCompanyLogo } from '@/lib/logo-service';
import { CompanyReport } from '@/types';

const CACHE_EXPIRY_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const { companyName } = await request.json();

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      );
    }

    const companyKey = createCompanyKey(companyName);
    const { db } = getFirebaseAdmin();

    // Check cache first
    if (db) {
      try {
        const docRef = db.collection('reports').doc(companyKey);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          const data = docSnap.data();
          const updatedAt = data?.updatedAt?.toDate?.() || new Date(data?.updatedAt);
          const ageInDays = daysSince(updatedAt);

          if (ageInDays < CACHE_EXPIRY_DAYS) {
            // Update search count
            await docRef.update({
              searchCount: (data?.searchCount || 0) + 1,
            });

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
              updatedAt: updatedAt,
              searchCount: (data?.searchCount || 0) + 1,
              generatedBy: 'cache',
            };

            console.log(`Cache hit for "${companyName}" (key: ${companyKey}), age: ${ageInDays} days`);

            return NextResponse.json({
              success: true,
              data: report,
            });
          } else {
            console.log(`Cache expired for "${companyName}" (age: ${ageInDays} days), regenerating...`);
          }
        }
      } catch (cacheError) {
        console.error('Cache lookup error:', cacheError);
        // Continue to generate new report
      }
    }

    // Generate new analysis
    console.log(`Generating new report for "${companyName}" (key: ${companyKey})`);
    const report = await analyzeCompany(companyName);

    // Add company key and search count
    report.companyKey = companyKey;
    report.searchCount = 1;

    // Fetch company logo
    try {
      const logoUrl = await fetchCompanyLogo(companyName, report.company.website);
      if (logoUrl) {
        report.company.logoUrl = logoUrl;
        console.log(`Found logo for "${companyName}": ${logoUrl}`);
      }
    } catch (logoError) {
      console.error('Failed to fetch logo:', logoError);
    }

    // Save to Firestore
    if (db) {
      try {
        const docRef = db.collection('reports').doc(companyKey);
        const existingDoc = await docRef.get();
        const existingSearchCount = existingDoc.exists ? (existingDoc.data()?.searchCount || 0) : 0;

        await docRef.set({
          companyKey: companyKey,
          company: report.company,
          analysis: {
            ...report.analysis,
            lastUpdated: new Date(),
          },
          createdAt: existingDoc.exists
            ? (existingDoc.data()?.createdAt || new Date())
            : new Date(),
          updatedAt: new Date(),
          searchCount: existingSearchCount + 1,
          generatedBy: 'ai',
        });

        report.id = companyKey;
        report.company.id = companyKey;
        report.searchCount = existingSearchCount + 1;

        console.log(`Saved report for "${companyName}" to Firestore`);
      } catch (saveError) {
        console.error('Failed to save report to Firestore:', saveError);
        // Continue without saving - still return the report
      }
    } else {
      console.warn('Firestore not initialized - report not cached');
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze company'
      },
      { status: 500 }
    );
  }
}
