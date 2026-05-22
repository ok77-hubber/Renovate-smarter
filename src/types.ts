export interface LayoutRoom {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export interface LayoutOption {
  title: string;
  description: string;
  rooms: LayoutRoom[];
  pros: string[];
  cons: string[];
}

export interface BudgetBreakdownItem {
  item: string;
  cost: number;
  percentage: number;
}

export interface BudgetFeasibility {
  status: string;
  assessment: string;
  breakdown: BudgetBreakdownItem[];
}

export interface RecommendationCategory {
  category: string;
  tips: string[];
}

export interface Palette {
  colors: string[];
  description: string;
}

export interface RenovateProposal {
  themeName: string;
  palette: Palette;
  overallSummary: string;
  budgetFeasibility: BudgetFeasibility;
  recommendations: RecommendationCategory[];
  layouts: {
    optionA: LayoutOption;
    optionB: LayoutOption;
  };
}

export interface RenovateInputs {
  housingType: string;
  location: string;
  budget: number;
  scope: 'whole' | 'rooms';
  roomsSelected: string[];
  colorScheme: string;
  otherPreferences: string;
  uploadedPlanUrl: string;
  uploadedPlanName: string;
  uploadedMoodBoardUrl?: string;
  uploadedMoodBoardName?: string;
  pricingPlan: string; // 'free' | 'basic_10' | 'pro_30'
}

export interface PricingPlanTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  recommendationLimit: number;
  actionText: string;
  isPopular?: boolean;
}
