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

// News item about company's political/controversial positions
export interface NewsItem {
  headline: string;
  source: string; // e.g., "Reuters", "X (@username)"
  url: string;
  date?: string;
  topic?: string;
}

// Subsidiary or owned brand
export interface Subsidiary {
  name: string;
  type: 'subsidiary' | 'brand' | 'division';
  description?: string;
  ownershipPercent?: number; // 100 = fully owned
}

// Affiliated company through partnerships, collaborations, or ownership stake
export interface Affiliate {
  name: string;
  relationshipType: 'partner' | 'investor' | 'joint_venture' | 'supplier' | 'distributor' | 'licensee' | 'collaboration';
  description?: string;
  ownershipPercent?: number; // for minority stakes
}

// Political position/stance on an issue
export interface PoliticalPosition {
  stance: string; // e.g., "supports tax reform", "against corporate regulation"
}

// Key affiliate company (for display in analysis section)
export interface KeyAffiliate {
  name: string;
  logoUrl?: string;
  relationship: string; // e.g., "owned by", "partner", "major supplier"
}

// Political compass coordinates
// x: -2 (Left) to +2 (Right)
// y: -2 (Safety/Authoritarian) to +2 (Freedom/Libertarian)
export interface PoliticalCompass {
  x: number; // Left (-2) to Right (+2)
  y: number; // Safety (-2) to Freedom (+2)
}

export interface PoliticalAnalysis {
  overallLeaning: 'Left' | 'Center-Left' | 'Center' | 'Center-Right' | 'Right' | 'Unknown';
  confidenceScore: number; // 0-100
  summary: string;
  politicalCompass?: PoliticalCompass;
  positions?: PoliticalPosition[]; // 5 key political stances
  keyAffiliates?: KeyAffiliate[]; // 5 most aligned business affiliates
  newsItems?: NewsItem[]; // Recent news about political/controversial positions
  donations: PoliticalDonation[];
  publicStatements: PublicStatement[];
  partnerships: Partnership[];
  subsidiaries?: Subsidiary[]; // Owned brands, companies, divisions
  affiliates?: Affiliate[]; // Business partners, collaborators, minority stakes
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

// Demand/Petition types
export type DemandCategory =
  // Business & Customer categories
  | 'Pricing'
  | 'Products & Services'
  | 'Locations'
  | 'Customer Experience'
  | 'Policies'
  | 'Partnerships'
  | 'Employee Treatment'
  // Social & Political categories
  | 'Environmental'
  | 'Labor Rights'
  | 'Corporate Governance'
  | 'Consumer Protection'
  | 'Social Justice'
  | 'Political Transparency'
  | 'Privacy & Data'
  | 'Other';

export interface ResolutionItem {
  id: string;
  text: string;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface Demand {
  id: string;
  title: string;
  category: DemandCategory;
  description: string; // The full essay/paragraph explaining the demand
  resolutionItems: ResolutionItem[]; // Actionable items for the demand to be considered met
  targetCompany?: string; // Optional: specific company being targeted
  targetCompanyKey?: string; // Normalized company name for matching
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  coSignCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'closed' | 'achieved';
}

export interface DemandCoSigner {
  id: string;
  demandId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  coSignedAt: Date;
}

export interface DemandComment {
  id: string;
  demandId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string; // For threaded replies
  likeCount: number;
}
