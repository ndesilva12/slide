import { CompanyReport, PoliticalAnalysis, Company } from '@/types';
import { resolveCompanyAlias } from './company-utils';

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface AIProvider {
  provider: 'xai' | 'anthropic';
  apiKey: string;
}

function getAIConfig(): AIProvider {
  // Prefer xAI (Grok), fallback to Anthropic
  if (process.env.XAI_API_KEY) {
    return { provider: 'xai', apiKey: process.env.XAI_API_KEY };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return { provider: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY };
  }
  throw new Error('No AI API key configured. Set XAI_API_KEY or ANTHROPIC_API_KEY.');
}

async function callXAI(messages: { role: string; content: string }[]): Promise<string> {
  const config = getAIConfig();

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-3',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`xAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(messages: { role: string; content: string }[]): Promise<string> {
  const config = getAIConfig();

  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const userMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemMessage,
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callAI(messages: { role: string; content: string }[]): Promise<string> {
  const config = getAIConfig();

  if (config.provider === 'xai') {
    return callXAI(messages);
  }
  return callAnthropic(messages);
}


const ANALYSIS_PROMPT = `You are a political research analyst. Analyze a company's political affiliations and positions.

Return a JSON object with this structure (all arrays can be empty if no data available):
{
  "company": {
    "name": "Official Company Name",
    "ticker": "TICKER or null",
    "industry": "Industry",
    "description": "Brief description",
    "website": "https://..."
  },
  "analysis": {
    "overallLeaning": "Left|Center-Left|Center|Center-Right|Right|Unknown",
    "confidenceScore": 0-100,
    "summary": "2-3 sentence summary of political stance",
    "politicalCompass": { "x": 0, "y": 0 },
    "donations": [],
    "publicStatements": [],
    "partnerships": [],
    "revenueBreakdown": null,
    "keyTopics": [],
    "sources": []
  }
}

Field details:
- politicalCompass: x is Left(-3) to Right(+3), y is Safety/Authoritarian(-3) to Freedom/Libertarian(+3). Set based on regulatory stance, privacy policies, government cooperation.
- donations: Include PAC, executive, and employee donations if known. Each: {recipient, party, amount, year, donorType, source}
- publicStatements: Leadership statements on policy. Each: {date, speaker, role, statement, topic, source, url}
- partnerships: Political orgs/trade associations. Each: {partnerName, partnerType, politicalLeaning, relevance}
- revenueBreakdown: If available from SEC filings, include percentages for executiveCompensation, employeeWages, operatingExpenses, researchAndDevelopment, marketing, stockBuybacks, dividends, capitalExpenditures, charitableDonations, lobbyingAndPolitical, netProfit, source, fiscalYear. Otherwise null.

Focus on GOVERNANCE policies: taxes, regulations, free speech, trade, government spending.
Return ONLY valid JSON.`;

export async function analyzeCompany(companyName: string): Promise<CompanyReport> {
  // Resolve company aliases (e.g., "Facebook" -> "Meta", "Google" -> "Alphabet", "X" -> "X Corp")
  const resolvedName = resolveCompanyAlias(companyName);

  const messages = [
    { role: 'system', content: ANALYSIS_PROMPT },
    {
      role: 'user',
      content: `Analyze: ${resolvedName}

Include political donations (PAC, executive, employee), public statements on governance policies (taxes, regulations, trade, free speech), and lobbying activities. Provide sources.`
    },
  ];

  const response = await callAI(messages);

  // Parse the JSON response
  let parsed;
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      console.error('No JSON found in AI response:', response.substring(0, 500));
      throw new Error('No JSON found in response');
    }
  } catch (e) {
    console.error('Failed to parse AI response:', response.substring(0, 500));
    throw new Error('Failed to parse AI analysis response');
  }

  // Validate parsed structure
  if (!parsed.company || !parsed.analysis) {
    console.error('Invalid response structure:', JSON.stringify(parsed).substring(0, 500));
    throw new Error('Invalid response structure from AI');
  }

  const now = new Date();

  const report: CompanyReport = {
    id: '', // Will be set by Firestore
    companyKey: '', // Will be set by API route
    company: {
      id: '', // Will be set by Firestore
      name: parsed.company?.name || companyName,
      ticker: parsed.company?.ticker || undefined,
      industry: parsed.company?.industry || undefined,
      description: parsed.company?.description || undefined,
      website: parsed.company?.website || undefined,
    },
    analysis: {
      overallLeaning: parsed.analysis?.overallLeaning || 'Unknown',
      confidenceScore: parsed.analysis?.confidenceScore || 50,
      summary: parsed.analysis?.summary || 'Analysis pending.',
      politicalCompass: parsed.analysis?.politicalCompass || undefined,
      donations: Array.isArray(parsed.analysis?.donations) ? parsed.analysis.donations : [],
      publicStatements: Array.isArray(parsed.analysis?.publicStatements) ? parsed.analysis.publicStatements : [],
      partnerships: Array.isArray(parsed.analysis?.partnerships) ? parsed.analysis.partnerships : [],
      revenueBreakdown: parsed.analysis?.revenueBreakdown || undefined,
      keyTopics: Array.isArray(parsed.analysis?.keyTopics) ? parsed.analysis.keyTopics : [],
      lastUpdated: now,
      sources: Array.isArray(parsed.analysis?.sources) ? parsed.analysis.sources : [],
    },
    createdAt: now,
    updatedAt: now,
    searchCount: 1,
    generatedBy: 'ai',
  };

  return report;
}

export async function searchCompaniesAI(query: string): Promise<Company[]> {
  const messages = [
    {
      role: 'system',
      content: `You are a company search assistant. Given a search query, return a JSON array of up to 10 companies that match the query. Include major publicly traded companies, well-known private companies, and relevant organizations.

Return format:
[
  {
    "name": "Company Name",
    "ticker": "TICKER or null",
    "industry": "Industry",
    "description": "Brief description"
  }
]

Return ONLY valid JSON array, no additional text.`
    },
    { role: 'user', content: `Search for companies matching: ${query}` },
  ];

  const response = await callAI(messages);

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const companies = JSON.parse(jsonMatch[0]);
      return companies.map((c: Omit<Company, 'id'>, i: number) => ({
        ...c,
        id: `search-${i}`,
      }));
    }
  } catch (e) {
    console.error('Failed to parse search response:', response);
  }

  return [];
}
