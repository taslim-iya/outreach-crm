export type WebsiteQuality = "none" | "poor" | "ok";

export type Business = {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  rating: number;
  reviewCount: number;
  hasWebsite: boolean;
  websiteUrl?: string | null;
  websiteScore?: number | null;
  websiteQuality?: WebsiteQuality;
  websiteIssues?: string[];
  websiteAnalysis?: string;
  websiteRecommendations?: string[];
  employees?: string;
  yearEstablished?: number;
  email?: string;
};

export type SearchMode = "no_website" | "poor_website" | "both";

export const CATEGORIES = [
  "All Categories",
  "Restaurant",
  "Plumber",
  "Electrician",
  "Auto Repair",
  "Hair Salon",
  "Dentist",
  "Lawyer",
  "Accountant",
  "Bakery",
  "Florist",
  "Dry Cleaning",
  "Pet Grooming",
  "Landscaping",
  "Cleaning Service",
  "Contractor",
];

export const MOCK_CITIES = [
  "Austin, TX",
  "Denver, CO",
  "Nashville, TN",
  "Phoenix, AZ",
  "Portland, OR",
  "Charlotte, NC",
  "Tampa, FL",
  "Las Vegas, NV",
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Miami, FL",
  "Seattle, WA",
  "Boston, MA",
  "Atlanta, GA",
];
