// User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
}

// Company types
export interface Company {
  id: string;
  name: string;
  ticker?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
}

// Political analysis types
export interface PoliticalDonation {
  recipient: string;
  party: 'Republican' | 'Democrat' | 'Independent' | 'Other';
  amount: number;
  year: number;
  donorType: 'Corporate PAC' | 'Executive' | 'Employee' | 'Other';
  source: string;
}

export interface RevenueBreakdown {
  executiveCompensation?: number; // percentage
  employeeWages?: number;
  operatingExpenses?: number;
  researchAndDevelopment?: number;
  marketing?: number;
  stockBuybacks?: number;
  dividends?: number;
  capitalExpenditures?: number;
  charitableDonations?: number;
  lobbyingAndPolitical?: number;
  netProfit?: number;
  other?: number;
  source?: string;
  fiscalYear?: number;
}

export interface PublicStatement {
  date: string;
  speaker: string;
  role: string;
  statement: string;
  topic: string;
  source: string;
  url?: string;
}

export interface Partnership {
  partnerName: string;
  partnerType: string;
  politicalLeaning?: string;
  relevance: string;
}

export interface PoliticalAnalysis {
  overallLeaning: 'Left' | 'Center-Left' | 'Center' | 'Center-Right' | 'Right' | 'Unknown';
  confidenceScore: number; // 0-100
  summary: string;
  donations: PoliticalDonation[];
  publicStatements: PublicStatement[];
  partnerships: Partnership[];
  revenueBreakdown?: RevenueBreakdown;
  keyTopics: string[];
  lastUpdated: Date;
  sources: string[];
}

export interface CompanyReport {
  id: string;
  companyKey: string; // Normalized company name for matching
  company: Company;
  analysis: PoliticalAnalysis;
  createdAt: Date;
  updatedAt: Date;
  searchCount: number; // Track popularity
  generatedBy: 'ai' | 'cache';
}

// User list types
export type ListType = 'support' | 'oppose' | 'custom';

export interface UserList {
  id: string;
  userId: string;
  name: string;
  type: ListType;
  description?: string;
  companyIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Search types
export interface SearchResult {
  company: Company;
  relevanceScore: number;
  hasReport: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
