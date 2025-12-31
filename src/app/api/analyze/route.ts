import { NextRequest, NextResponse } from 'next/server';
import { analyzeCompany } from '@/lib/ai-service';
import { getReportByCompanyName, saveReport } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const { companyName } = await request.json();

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedReport = await getReportByCompanyName(companyName);
    if (cachedReport) {
      // Check if cache is less than 7 days old
      const cacheAge = Date.now() - new Date(cachedReport.updatedAt).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (cacheAge < sevenDays) {
        return NextResponse.json({
          success: true,
          data: { ...cachedReport, generatedBy: 'cache' },
        });
      }
    }

    // Generate new analysis
    const report = await analyzeCompany(companyName);

    // Save to Firestore
    try {
      const reportId = await saveReport(report);
      report.id = reportId;
      report.company.id = reportId;
    } catch (saveError) {
      console.error('Failed to save report to Firestore:', saveError);
      // Continue without saving - still return the report
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
