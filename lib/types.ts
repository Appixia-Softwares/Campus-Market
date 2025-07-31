// Enhanced User Types and Badge System for Campus Market

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  university_id?: string;
  student_id?: string;
  phone?: string;
  whatsapp_number?: string;
  course?: string;
  year_of_study?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'banned';
  role?: 'student' | 'non_student' | 'admin' | 'moderator' | 'official' | 'verified_seller' | 'premium';
  occupation?: string;
  organization?: string;
  reason?: string;
  
  // Enhanced profile fields
  bio?: string;
  location?: string;
  
  // Notification preferences
  email_notifications?: boolean;
  push_notifications?: boolean;
  message_notifications?: boolean;
  marketing_emails?: boolean;
  
  // Privacy settings
  profile_visible?: boolean;
  show_online_status?: boolean;
  show_contact_info?: boolean;
  
  // Verification status
  verified?: boolean;
  email_verified?: boolean;
  
  // Official Campus Market Account
  is_official_account?: boolean;
  official_badge?: OfficialBadge;
  account_tier?: AccountTier;
  
  // Badges and achievements
  badges?: Badge[];
  achievements?: Achievement[];
  
  // Statistics
  total_sales?: number;
  total_reviews?: number;
  average_rating?: number;
  member_since?: Date;
  
  // Timestamps
  created_at?: Date;
  updated_at?: Date;
  last_login?: Date;
}

// Official Badge Types - Like Facebook's verification system
export type OfficialBadge = 
  | 'campus_market_official'
  | 'verified_seller'
  | 'premium_member'
  | 'trusted_seller'
  | 'top_seller'
  | 'community_leader'
  | 'early_adopter'
  | 'beta_tester'
  | 'campus_ambassador'
  | 'moderator'
  | 'admin';

// Account Tiers
export type AccountTier = 
  | 'free'
  | 'basic'
  | 'premium'
  | 'official'
  | 'enterprise';

// Badge System - Like Facebook's achievement system
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: BadgeCategory;
  earned_at: Date;
  criteria: BadgeCriteria;
}

export type BadgeCategory = 
  | 'achievement'
  | 'verification'
  | 'official'
  | 'community'
  | 'sales'
  | 'special';

export interface BadgeCriteria {
  type: 'sales_count' | 'reviews_count' | 'time_active' | 'verification' | 'manual' | 'special';
  value?: number;
  description: string;
}

// Achievement System
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  max_progress: number;
  completed: boolean;
  completed_at?: Date;
  rewards?: AchievementReward[];
}

export interface AchievementReward {
  type: 'badge' | 'feature' | 'discount' | 'special_access';
  value: string;
  description: string;
}

// Official Account Types
export interface OfficialAccount {
  id: string;
  user_id: string;
  account_type: OfficialAccountType;
  badge: OfficialBadge;
  tier: AccountTier;
  permissions: Permission[];
  verified_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

export type OfficialAccountType = 
  | 'campus_market_official'
  | 'verified_seller'
  | 'premium_member'
  | 'community_leader'
  | 'moderator'
  | 'admin';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export type PermissionCategory = 
  | 'moderation'
  | 'analytics'
  | 'features'
  | 'communication'
  | 'management';

// Badge Display Component Props
export interface BadgeDisplayProps {
  badges?: Badge[]
  officialBadge?: OfficialBadge
  accountTier?: string
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
  maxDisplay?: number
  className?: string
}

// User Profile with Badges
export interface UserProfileWithBadges extends User {
  badges: Badge[];
  achievements: Achievement[];
  official_account?: OfficialAccount;
  statistics: UserStatistics;
}

export interface UserStatistics {
  total_sales: number;
  total_reviews: number;
  average_rating: number;
  response_rate: number;
  member_since: Date;
  listings_count: number;
  followers_count: number;
  following_count: number;
}

// Badge Configuration - Like Facebook's verification badges
export const BADGE_CONFIG: Record<OfficialBadge, BadgeConfig> = {
  campus_market_official: {
    name: 'Official Account',
    description: 'Official Campus Market verified account',
    icon: 'Building',
    color: 'bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-600',
    priority: 1,
  },
  verified_seller: {
    name: 'Verified Seller',
    description: 'Identity verified by Campus Market',
    icon: 'CheckCircle',
    color: 'bg-green-600',
    textColor: 'text-white',
    borderColor: 'border-green-600',
    priority: 2,
  },
  premium_member: {
    name: 'Premium Member',
    description: 'Premium account with enhanced features',
    icon: 'Star',
    color: 'bg-yellow-500',
    textColor: 'text-white',
    borderColor: 'border-yellow-500',
    priority: 3,
  },
  trusted_seller: {
    name: 'Trusted Seller',
    description: 'High-rated and trusted by the community',
    icon: 'Shield',
    color: 'bg-purple-600',
    textColor: 'text-white',
    borderColor: 'border-purple-600',
    priority: 4,
  },
  top_seller: {
    name: 'Top Seller',
    description: 'One of the top performing sellers',
    icon: 'Trophy',
    color: 'bg-orange-500',
    textColor: 'text-white',
    borderColor: 'border-orange-500',
    priority: 5,
  },
  community_leader: {
    name: 'Community Leader',
    description: 'Active and respected community member',
    icon: 'Users',
    color: 'bg-indigo-600',
    textColor: 'text-white',
    borderColor: 'border-indigo-600',
    priority: 6,
  },
  early_adopter: {
    name: 'Early Adopter',
    description: 'Joined during the early access period',
    icon: 'Rocket',
    color: 'bg-pink-600',
    textColor: 'text-white',
    borderColor: 'border-pink-600',
    priority: 7,
  },
  beta_tester: {
    name: 'Beta Tester',
    description: 'Helped test new features and improvements',
    icon: 'TestTube',
    color: 'bg-teal-600',
    textColor: 'text-white',
    borderColor: 'border-teal-600',
    priority: 8,
  },
  campus_ambassador: {
    name: 'Campus Ambassador',
    description: 'Official campus representative',
    icon: 'GraduationCap',
    color: 'bg-red-600',
    textColor: 'text-white',
    borderColor: 'border-red-600',
    priority: 9,
  },
  moderator: {
    name: 'Moderator',
    description: 'Community moderator and helper',
    icon: 'ShieldCheck',
    color: 'bg-gray-700',
    textColor: 'text-white',
    borderColor: 'border-gray-700',
    priority: 10,
  },
  admin: {
    name: 'Administrator',
    description: 'Platform administrator',
    icon: 'Zap',
    color: 'bg-black',
    textColor: 'text-white',
    borderColor: 'border-black',
    priority: 11,
  },
};

export interface BadgeConfig {
  name: string;
  description: string;
  icon: string;
  color: string;
  textColor: string;
  borderColor: string;
  priority: number;
}

// Account Tier Benefits
export const ACCOUNT_TIER_BENEFITS: Record<AccountTier, TierBenefits> = {
  free: {
    name: 'Free',
    description: 'Basic account features',
    features: [
      'Create listings',
      'Basic messaging',
      'Standard support',
    ],
    limitations: [
      'Limited listings per month',
      'Basic analytics',
      'Standard response time',
    ],
  },
  basic: {
    name: 'Basic',
    description: 'Enhanced features for active users',
    features: [
      'All free features',
      'Priority listing placement',
      'Enhanced messaging',
      'Basic analytics',
    ],
    limitations: [
      'Monthly listing limit',
      'Standard support',
    ],
  },
  premium: {
    name: 'Premium',
    description: 'Advanced features for power users',
    features: [
      'All basic features',
      'Unlimited listings',
      'Advanced analytics',
      'Priority support',
      'Featured listings',
      'Custom branding',
    ],
    limitations: [
      'No major limitations',
    ],
  },
  official: {
    name: 'Official',
    description: 'Official Campus Market account',
    features: [
      'All premium features',
      'Official badge',
      'Verified status',
      'Priority placement',
      'Dedicated support',
      'Early access to features',
    ],
    limitations: [
      'Must meet verification criteria',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For universities and large organizations',
    features: [
      'All official features',
      'Custom integrations',
      'White-label options',
      'Dedicated account manager',
      'Advanced analytics',
      'API access',
    ],
    limitations: [
      'Contact sales for pricing',
    ],
  },
};

export interface TierBenefits {
  name: string;
  description: string;
  features: string[];
  limitations: string[];
}
