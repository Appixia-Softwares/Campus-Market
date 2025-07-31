'use client'

import React from 'react'
import { Badge as UIBadge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BADGE_CONFIG, type OfficialBadge, type Badge } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Building,
  CheckCircle,
  Star,
  Shield,
  Trophy,
  Users,
  Rocket,
  TestTube,
  GraduationCap,
  ShieldCheck,
  Zap,
  Award,
  Mail,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Heart,
  MessageCircle,
  ShoppingCart,
  DollarSign,
  Crown,
  CheckSquare,
  UserCheck,
  Activity,
  Gift,
  Medal,
  Sparkles,
  BadgeCheck,
  Star as StarIcon,
  Zap as ZapIcon,
} from 'lucide-react'

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    Building,
    CheckCircle,
    Star,
    Shield,
    Trophy,
    Users,
    Rocket,
    TestTube,
    GraduationCap,
    ShieldCheck,
    Zap,
    Award,
    Mail,
    Calendar,
    Clock,
    Target,
    TrendingUp,
    Heart,
    MessageCircle,
    ShoppingCart,
    DollarSign,
    Crown,
    CheckSquare,
    UserCheck,
    Activity,
    Gift,
    Medal,
    Sparkles,
    BadgeCheck,
    StarIcon,
    ZapIcon,
  }
  return iconMap[iconName] || Award
}

interface BadgeDisplayProps {
  badges?: Badge[]
  officialBadge?: OfficialBadge
  accountTier?: string
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
  maxDisplay?: number
  className?: string
}

export function BadgeDisplay({
  badges = [],
  officialBadge,
  accountTier,
  showTooltip = true,
  size = 'md',
  maxDisplay = 3,
  className,
}: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const renderBadge = (badge: Badge | OfficialBadge, isOfficial = false) => {
    let config
    let badgeData

    if (isOfficial && typeof badge === 'string') {
      config = BADGE_CONFIG[badge as OfficialBadge]
      badgeData = {
        name: config.name,
        description: config.description,
        icon: config.icon,
      }
    } else {
      badgeData = badge as Badge
      config = {
        color: badgeData.color || 'bg-gray-500',
        textColor: 'text-white',
        borderColor: 'border-gray-500',
      }
    }

    const IconComponent = getIconComponent(badgeData.icon)
    
    const badgeElement = (
      <UIBadge
        className={cn(
          config.color,
          config.textColor,
          config.borderColor,
          sizeClasses[size],
          'flex items-center gap-1 font-medium',
          className
        )}
      >
        <IconComponent className={cn('flex-shrink-0', iconSizes[size])} />
        <span className="hidden sm:inline">{badgeData.name}</span>
      </UIBadge>
    )

    if (showTooltip) {
      return (
        <TooltipProvider key={isOfficial ? `official-${badge}` : badgeData.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              {badgeElement}
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-semibold">{badgeData.name}</div>
                <div className="text-sm text-muted-foreground">
                  {badgeData.description}
                </div>
                {!isOfficial && badgeData.earned_at && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Earned {new Date(badgeData.earned_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return badgeElement
  }

  const allBadges = [
    // Official badge (highest priority)
    ...(officialBadge ? [officialBadge] : []),
    // Regular badges
    ...badges,
  ]

  const displayedBadges = allBadges.slice(0, maxDisplay)
  const remainingCount = allBadges.length - maxDisplay

  return (
    <div className="flex flex-wrap items-center gap-1">
      {displayedBadges.map((badge, index) => {
        const isOfficial = index === 0 && officialBadge
        return (
          <div key={isOfficial ? `official-${badge}` : (badge as Badge).id}>
            {renderBadge(badge, !!isOfficial)}
          </div>
        )
      })}
      {remainingCount > 0 && (
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <UIBadge
                variant="outline"
                className={cn(
                  sizeClasses[size],
                  'cursor-help'
                )}
              >
                +{remainingCount}
              </UIBadge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-semibold">More Badges</div>
                <div className="text-sm text-muted-foreground">
                  {remainingCount} additional badge{remainingCount !== 1 ? 's' : ''}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

// Specialized badge components for different contexts
export function OfficialBadgeDisplay({ badge, size = 'md' }: { badge: OfficialBadge; size?: 'sm' | 'md' | 'lg' }) {
  return <BadgeDisplay officialBadge={badge} size={size} showTooltip={true} />
}

export function UserBadgeDisplay({ user, size = 'md', maxDisplay = 3 }: { 
  user: any; 
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
}) {
  return (
    <BadgeDisplay
      badges={user.badges || []}
      officialBadge={user.official_badge}
      accountTier={user.account_tier}
      size={size}
      maxDisplay={maxDisplay}
    />
  )
}

// Compact badge display for small spaces
export function CompactBadgeDisplay({ badges, officialBadge }: { 
  badges?: Badge[]; 
  officialBadge?: OfficialBadge;
}) {
  return (
    <div className="flex items-center gap-1">
      {officialBadge && (
        <div className="flex-shrink-0">
          {renderBadge(officialBadge, true)}
        </div>
      )}
      {badges && badges.length > 0 && (
        <div className="flex items-center gap-1">
          {badges.slice(0, 2).map((badge) => (
            <div key={badge.id} className="flex-shrink-0">
              {renderBadge(badge)}
            </div>
          ))}
          {badges.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{badges.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to render a single badge
function renderBadge(badge: Badge | OfficialBadge, isOfficial = false) {
  let config
  let badgeData

  if (isOfficial && typeof badge === 'string') {
    config = BADGE_CONFIG[badge as OfficialBadge]
    badgeData = {
      name: config.name,
      description: config.description,
      icon: config.icon,
    }
  } else {
    badgeData = badge as Badge
    config = {
      color: badgeData.color || 'bg-gray-500',
      textColor: 'text-white',
      borderColor: 'border-gray-500',
    }
  }

  const IconComponent = getIconComponent(badgeData.icon)
  
  return (
    <UIBadge
      className={cn(
        config.color,
        config.textColor,
        config.borderColor,
        'text-xs px-1.5 py-0.5 flex items-center gap-1 font-medium'
      )}
    >
      <IconComponent className="h-3 w-3 flex-shrink-0" />
    </UIBadge>
  )
} 