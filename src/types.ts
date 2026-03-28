export interface ClientData {
  id?: string;
  businessName: string;
  websiteUrl: string;
  industry: string;
  businessSize: string;
  yearsInBusiness: number;
  monthlyRevenue: string;
  location: string;
  painPoints: { name: string; score: number }[];
  tools: string[];
  budget: number;
  primaryGoal: string;
  target90Day: string;
  vision12Month: string;
  successMetric: string;
  competitors: CompetitorAnalysis[];
  packageSelected?: string;
  reportGenerated?: boolean;
  createdAt: string;
  uid: string;
}

export interface CompetitorAnalysis {
  url: string;
  estimatedTraffic?: string;
  contentStrategy?: string;
  socialPresenceScore?: number;
  weaknessIdentified?: string;
  competitiveAdvantage?: string;
}

export interface ReportData {
  executiveSummary: string;
  painPointAnalysis: { name: string; severity: number; solution: string }[];
  competitorGapAnalysis: string;
  roadmap90Day: {
    week1_4: string;
    month2: string;
    month3: string;
  };
  roiProjection: string;
  recommendedStack: string[];
  quickWins: string[];
}
