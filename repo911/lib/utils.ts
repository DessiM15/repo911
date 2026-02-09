import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function getQualificationColor(tier: string | null): string {
  switch (tier) {
    case 'hot':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'warm':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'cold':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'disqualified':
      return 'text-gray-500 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-500 bg-gray-50 border-gray-200';
  }
}

export function getQualificationLabel(tier: string | null): string {
  switch (tier) {
    case 'hot':
      return 'Hot Lead';
    case 'warm':
      return 'Warm Lead';
    case 'cold':
      return 'Cold Lead';
    case 'disqualified':
      return 'Not Qualified';
    default:
      return 'Pending';
  }
}

export function getEstimatedValueRange(score: number): string {
  if (score >= 80) return '$25,000 - $100,000+';
  if (score >= 60) return '$10,000 - $50,000';
  if (score >= 30) return '$5,000 - $25,000';
  return '$1,000 - $10,000';
}

export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'VI', label: 'US Virgin Islands' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'AS', label: 'American Samoa' },
  { value: 'GU', label: 'Guam' },
  { value: 'MP', label: 'Northern Mariana Islands' },
] as const;

export const COMMON_LENDERS = [
  'Ally Financial',
  'Santander Consumer USA',
  'Capital One Auto Finance',
  'Credit Acceptance',
  'Westlake Financial',
  'Bridgecrest/DriveTime',
  'Exeter Finance',
  'CarMax Auto Finance',
  'GM Financial',
  'Ford Motor Credit',
  'Toyota Financial Services',
  'Chase Auto Finance',
  'Wells Fargo Auto',
  'PNC Bank Auto',
  'US Bank Auto',
  'BMW Financial',
  'Nissan Motor Acceptance',
  'Hyundai Capital America',
  'CNAC/JD Byrider',
  'Regional Acceptance Corp',
] as const;
