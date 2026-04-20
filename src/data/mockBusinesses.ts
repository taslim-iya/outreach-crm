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

/** Demo businesses for "Try Demo Data" — lets users explore the UI without a real search */
export const DEMO_BUSINESSES: Business[] = [
  { id: "demo-1", name: "Mario's Pizza Kitchen", category: "Restaurant", address: "42 Oak Street", city: "Austin", state: "TX", phone: "(512) 555-0142", rating: 4.6, reviewCount: 187, hasWebsite: false, yearEstablished: 2015 },
  { id: "demo-2", name: "Bright Spark Electric", category: "Electrician", address: "118 Elm Ave", city: "Austin", state: "TX", phone: "(512) 555-0298", rating: 4.8, reviewCount: 94, hasWebsite: false, employees: "5-10", yearEstablished: 2019 },
  { id: "demo-3", name: "Dave's Drain Solutions", category: "Plumber", address: "7 Pine Road", city: "Austin", state: "TX", phone: "(512) 555-0371", rating: 4.3, reviewCount: 62, hasWebsite: false, yearEstablished: 2012 },
  { id: "demo-4", name: "Glamour Cuts Salon", category: "Hair Salon", address: "250 Main Street", city: "Austin", state: "TX", phone: "(512) 555-0485", rating: 4.9, reviewCount: 231, hasWebsite: false, employees: "3-5" },
  { id: "demo-5", name: "Green Thumb Landscaping", category: "Landscaping", address: "33 Cedar Lane", city: "Austin", state: "TX", phone: "(512) 555-0519", rating: 4.5, reviewCount: 47, hasWebsite: false, yearEstablished: 2020 },
  { id: "demo-6", name: "Sweet Crumbs Bakery", category: "Bakery", address: "89 Market Square", city: "Austin", state: "TX", phone: "(512) 555-0633", rating: 4.7, reviewCount: 156, hasWebsite: false, yearEstablished: 2018 },
];
