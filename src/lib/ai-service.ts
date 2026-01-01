import { CompanyReport, PoliticalAnalysis, Company } from '@/types';

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

const ANALYSIS_PROMPT = `You are a political research analyst. Your task is to analyze a company's political affiliations, donations, positions, and financial allocation.

For the given company, provide a comprehensive analysis in JSON format with the following structure:
{
  "company": {
    "name": "Company Name",
    "ticker": "TICKER or null",
    "industry": "Industry",
    "description": "Brief company description",
    "website": "https://..."
  },
  "analysis": {
    "overallLeaning": "Left" | "Center-Left" | "Center" | "Center-Right" | "Right" | "Unknown",
    "confidenceScore": 0-100,
    "summary": "A 2-3 sentence summary of the company's political stance",
    "donations": [
      {
        "recipient": "Politician or PAC name",
        "party": "Republican" | "Democrat" | "Independent" | "Other",
        "amount": 10000,
        "year": 2024,
        "donorType": "Corporate PAC" | "Executive" | "Employee" | "Other",
        "source": "FEC records / OpenSecrets / etc."
      }
    ],
    "publicStatements": [
      {
        "date": "YYYY-MM-DD",
        "speaker": "Name",
        "role": "CEO / Spokesperson / etc.",
        "statement": "Quote or paraphrase",
        "topic": "Topic category",
        "source": "Source name",
        "url": "https://..."
      }
    ],
    "partnerships": [
      {
        "partnerName": "Organization name",
        "partnerType": "Advocacy group / Trade association / etc.",
        "politicalLeaning": "Description of political stance",
        "relevance": "Why this partnership matters politically"
      }
    ],
    "revenueBreakdown": {
      "executiveCompensation": 5,
      "employeeWages": 30,
      "operatingExpenses": 20,
      "researchAndDevelopment": 15,
      "marketing": 10,
      "stockBuybacks": 5,
      "dividends": 3,
      "capitalExpenditures": 5,
      "charitableDonations": 1,
      "lobbyingAndPolitical": 0.5,
      "netProfit": 5.5,
      "source": "Annual report / SEC filings",
      "fiscalYear": 2024
    },
    "keyTopics": ["Topic 1", "Topic 2"],
    "sources": ["Source 1", "Source 2"]
  }
}

Guidelines:
1. Be factual and cite sources where possible

2. DONATIONS - Include political donations from ALL sources:
   - Corporate PAC donations
   - Executive and leadership donations
   - Employee donations (aggregate when available from FEC/OpenSecrets)
   - Mark each donation with the appropriate donorType

3. POLITICAL TOPICS - Focus primarily on GOVERNANCE policies:
   - Taxes and tax policy (corporate tax rates, tax incentives, offshore policies)
   - Regulations and regulatory policy (support/opposition to industry regulation)
   - Freedom of speech and censorship (content moderation, platform policies)
   - Foreign policy (trade deals, tariffs, international relations)
   - Government spending and fiscal policy
   - Privacy vs security tradeoffs
   - Free market vs protectionism
   - Monetary policy positions

   Secondary consideration for social issues:
   - Climate and environmental policy
   - Labor and workplace policies
   - Healthcare policy
   - Immigration policy

4. REVENUE BREAKDOWN - Show where company money goes as percentages:
   - Executive compensation (C-suite, board)
   - Employee wages and benefits
   - Operating expenses
   - R&D investment
   - Marketing and advertising
   - Stock buybacks and dividends
   - Capital expenditures
   - Charitable donations
   - Lobbying and political spending
   - Net profit retained
   Use data from annual reports, 10-K filings, or proxy statements. Estimate if exact data unavailable.

5. Consider lobbying activities and trade association memberships
6. If information is limited, acknowledge uncertainty with a lower confidence score
7. Always include the source of information

Return ONLY valid JSON, no additional text.`;

export async function analyzeCompany(companyName: string): Promise<CompanyReport> {
  const messages = [
    { role: 'system', content: ANALYSIS_PROMPT },
    {
      role: 'user',
      content: `Analyze the political affiliations, donations, positions, and financial allocation of: ${companyName}

Please search for and include:
1. Political donations from the company's PAC, executives, AND employees (check FEC records, OpenSecrets)
2. Public statements on GOVERNANCE issues: taxes, regulations, free speech, censorship, foreign policy, trade, government spending
3. Lobbying activities and political advocacy
4. Partnerships with politically-aligned organizations
5. Revenue/expense breakdown: where does the company's money go? (executive pay, wages, R&D, buybacks, lobbying, etc.)
6. Any notable positions on regulatory, fiscal, or trade policy

Focus on governance and policy positions over social issues. Provide comprehensive, factual analysis with sources.`
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
      throw new Error('No JSON found in response');
    }
  } catch (e) {
    console.error('Failed to parse AI response:', response);
    throw new Error('Failed to parse AI analysis response');
  }

  const now = new Date();

  const report: CompanyReport = {
    id: '', // Will be set by Firestore
    companyKey: '', // Will be set by API route
    company: {
      id: '', // Will be set by Firestore
      name: parsed.company.name || companyName,
      ticker: parsed.company.ticker,
      industry: parsed.company.industry,
      description: parsed.company.description,
      website: parsed.company.website,
    },
    analysis: {
      overallLeaning: parsed.analysis.overallLeaning || 'Unknown',
      confidenceScore: parsed.analysis.confidenceScore || 50,
      summary: parsed.analysis.summary || 'Analysis pending.',
      donations: parsed.analysis.donations || [],
      publicStatements: parsed.analysis.publicStatements || [],
      partnerships: parsed.analysis.partnerships || [],
      revenueBreakdown: parsed.analysis.revenueBreakdown || undefined,
      keyTopics: parsed.analysis.keyTopics || [],
      lastUpdated: now,
      sources: parsed.analysis.sources || [],
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
