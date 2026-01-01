import { NextRequest, NextResponse } from 'next/server';
import { analyzeCompany } from '@/lib/ai-service';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { createCompanyKey, daysSince } from '@/lib/company-utils';
import { fetchCompanyLogo } from '@/lib/logo-service';
import { CompanyReport } from '@/types';

const CACHE_EXPIRY_DAYS = 30;

// Increment this version when report format changes to force cache refresh
// v1: Initial format
// v2: Added politicalCompass, revenueBreakdown, donorType, governance focus
// v3: Simplified prompt for reliability, added company aliases
// v4: Force refresh for X Corp (was showing old Twitter Inc data)
// v5: Use official company name from AI for cache key
// v6: Added subsidiaries and affiliates sections
const REPORT_SCHEMA_VERSION = 6;

/**
 * Sanitize data for Firestore - remove undefined values and convert invalid types
 */
function sanitizeForFirestore(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized;
  }

  // Primitive types (string, number, boolean)
  return obj;
}

export async function POST(request: NextRequest) {
  try {
    const { companyName, forceRefresh } = await request.json();

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();

    // Log DB status at the start
    console.log(`[ANALYZE] Search: "${companyName}", DB initialized: ${!!db}`);

    // First, try to find by search term key (for backwards compatibility)
    const searchKey = createCompanyKey(companyName);
    console.log(`[ANALYZE] Search key: "${searchKey}"`);

    // Check cache first using search term key (skip if forceRefresh is true)
    if (db && !forceRefresh) {
      try {
        const docRef = db.collection('reports').doc(searchKey);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          const data = docSnap.data();
          const updatedAt = data?.updatedAt?.toDate?.() || new Date(data?.updatedAt);
          const ageInDays = daysSince(updatedAt);
          const cachedSchemaVersion = data?.schemaVersion || 1;

          // Check both cache age AND schema version
          if (ageInDays < CACHE_EXPIRY_DAYS && cachedSchemaVersion >= REPORT_SCHEMA_VERSION) {
            // Update search count
            await docRef.update({
              searchCount: (data?.searchCount || 0) + 1,
            });

            // Convert Firestore timestamps to dates
            const report: CompanyReport = {
              id: docSnap.id,
              companyKey: data?.companyKey || searchKey,
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

            console.log(`Cache hit for "${companyName}" (key: ${searchKey}), age: ${ageInDays} days, schema: v${cachedSchemaVersion}`);

            return NextResponse.json({
              success: true,
              data: report,
            });
          } else if (cachedSchemaVersion < REPORT_SCHEMA_VERSION) {
            console.log(`Schema outdated for "${companyName}" (v${cachedSchemaVersion} < v${REPORT_SCHEMA_VERSION}), regenerating...`);
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
    console.log(`Generating new report for "${companyName}"`);
    const report = await analyzeCompany(companyName);

    // Create company key from the OFFICIAL company name returned by AI
    const officialName = report.company.name;
    const companyKey = createCompanyKey(officialName);

    console.log(`AI returned official name: "${officialName}" -> key: "${companyKey}"`);

    // Check if we already have this company under its official name
    if (db && !forceRefresh && companyKey !== searchKey) {
      try {
        const officialDocRef = db.collection('reports').doc(companyKey);
        const officialDocSnap = await officialDocRef.get();

        if (officialDocSnap.exists) {
          const data = officialDocSnap.data();
          const updatedAt = data?.updatedAt?.toDate?.() || new Date(data?.updatedAt);
          const ageInDays = daysSince(updatedAt);
          const cachedSchemaVersion = data?.schemaVersion || 1;

          if (ageInDays < CACHE_EXPIRY_DAYS && cachedSchemaVersion >= REPORT_SCHEMA_VERSION) {
            // Update search count
            await officialDocRef.update({
              searchCount: (data?.searchCount || 0) + 1,
            });

            const cachedReport: CompanyReport = {
              id: officialDocSnap.id,
              companyKey: companyKey,
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

            console.log(`Cache hit for official name "${officialName}" (key: ${companyKey})`);

            return NextResponse.json({
              success: true,
              data: cachedReport,
            });
          }
        }
      } catch (err) {
        console.error('Official name cache lookup error:', err);
      }
    }

    // Set the company key on the report
    report.companyKey = companyKey;
    report.searchCount = 1;

    // Fetch company logo
    try {
      const logoUrl = await fetchCompanyLogo(officialName, report.company.website);
      if (logoUrl) {
        report.company.logoUrl = logoUrl;
        console.log(`Found logo for "${officialName}": ${logoUrl}`);
      }
    } catch (logoError) {
      console.error('Failed to fetch logo:', logoError);
    }

    // Save to Firestore using the OFFICIAL company name key
    if (db) {
      try {
        console.log(`Saving report for "${officialName}" with key: ${companyKey}`);
        const docRef = db.collection('reports').doc(companyKey);
        const existingDoc = await docRef.get();
        const existingSearchCount = existingDoc.exists ? (existingDoc.data()?.searchCount || 0) : 0;

        const reportData = sanitizeForFirestore({
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
          schemaVersion: REPORT_SCHEMA_VERSION,
        });

        await docRef.set(reportData as FirebaseFirestore.DocumentData);

        report.id = companyKey;
        report.company.id = companyKey;
        report.searchCount = existingSearchCount + 1;

        console.log(`SUCCESS: Saved report for "${officialName}" to Firestore (key: ${companyKey})`);
      } catch (saveError) {
        console.error(`FAILED to save report for "${officialName}" (key: ${companyKey}):`, saveError);
        // Continue without saving - still return the report
      }
    } else {
      console.error(`ERROR: Firestore DB not initialized - cannot save report for "${officialName}". Check FIREBASE_SERVICE_ACCOUNT_KEY env var.`);
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
