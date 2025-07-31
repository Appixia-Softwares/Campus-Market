import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where, updateDoc } from 'firebase/firestore'

// Initial badges configuration
const INITIAL_BADGES = [
  {
    id: 'first_sale',
    name: 'First Sale',
    description: 'Completed your first sale on Campus Market',
    icon: 'Gift',
    color: 'bg-green-500',
    category: 'achievement',
    criteria: {
      type: 'sales_count',
      value: 1,
      description: 'Complete your first sale',
    },
  },
  {
    id: 'active_seller',
    name: 'Active Seller',
    description: 'Completed 10+ sales',
    icon: 'Trophy',
    color: 'bg-blue-500',
    category: 'sales',
    criteria: {
      type: 'sales_count',
      value: 10,
      description: 'Complete 10 sales',
    },
  },
  {
    id: 'top_seller',
    name: 'Top Seller',
    description: 'Completed 50+ sales',
    icon: 'Crown',
    color: 'bg-yellow-500',
    category: 'sales',
    criteria: {
      type: 'sales_count',
      value: 50,
      description: 'Complete 50 sales',
    },
  },
  {
    id: 'revenue_generator',
    name: 'Revenue Generator',
    description: 'Generated $1000+ in sales',
    icon: 'DollarSign',
    color: 'bg-green-500',
    category: 'sales',
    criteria: {
      type: 'sales_count',
      value: 1000,
      description: 'Generate $1000 in sales',
    },
  },
  {
    id: 'verified_member',
    name: 'Verified Member',
    description: 'Account verified by Campus Market',
    icon: 'CheckCircle',
    color: 'bg-green-500',
    category: 'verification',
    criteria: {
      type: 'verification',
      description: 'Account verification completed',
    },
  },
  {
    id: 'email_verified',
    name: 'Email Verified',
    description: 'Email address verified',
    icon: 'Mail',
    color: 'bg-blue-500',
    category: 'verification',
    criteria: {
      type: 'verification',
      description: 'Email verification completed',
    },
  },
  {
    id: 'monthly_member',
    name: 'Monthly Member',
    description: 'Active for 30+ days',
    icon: 'Calendar',
    color: 'bg-purple-500',
    category: 'achievement',
    criteria: {
      type: 'time_active',
      value: 30,
      description: 'Active for 30 days',
    },
  },
  {
    id: 'long_term_member',
    name: 'Long-term Member',
    description: 'Active for 90+ days',
    icon: 'Medal',
    color: 'bg-orange-500',
    category: 'achievement',
    criteria: {
      type: 'time_active',
      value: 90,
      description: 'Active for 90 days',
    },
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined during early access period',
    icon: 'Rocket',
    color: 'bg-pink-500',
    category: 'special',
    criteria: {
      type: 'special',
      description: 'Joined during early access',
    },
  },
  {
    id: 'community_leader',
    name: 'Community Leader',
    description: 'Active community member with high engagement',
    icon: '👥',
    color: 'bg-indigo-500',
    category: 'community',
    criteria: {
      type: 'special',
      description: 'High community engagement',
    },
  },
]

// Initial achievements configuration
const INITIAL_ACHIEVEMENTS = [
  {
    id: 'sales_milestone_1',
    name: 'First Steps',
    description: 'Complete your first 5 sales',
    icon: '👣',
    max_progress: 5,
    category: 'sales',
    rewards: [
      {
        type: 'badge',
        value: 'first_sale',
        description: 'First Sale Badge',
      },
    ],
  },
  {
    id: 'sales_milestone_2',
    name: 'Growing Business',
    description: 'Complete 25 sales',
    icon: '📈',
    max_progress: 25,
    category: 'sales',
    rewards: [
      {
        type: 'badge',
        value: 'active_seller',
        description: 'Active Seller Badge',
      },
    ],
  },
  {
    id: 'sales_milestone_3',
    name: 'Sales Master',
    description: 'Complete 100 sales',
    icon: '👑',
    max_progress: 100,
    category: 'sales',
    rewards: [
      {
        type: 'badge',
        value: 'top_seller',
        description: 'Top Seller Badge',
      },
    ],
  },
  {
    id: 'revenue_milestone_1',
    name: 'Money Maker',
    description: 'Generate $500 in sales',
    icon: '💵',
    max_progress: 500,
    category: 'sales',
    rewards: [
      {
        type: 'feature',
        value: 'priority_listing',
        description: 'Priority listing placement',
      },
    ],
  },
  {
    id: 'revenue_milestone_2',
    name: 'Big Spender',
    description: 'Generate $2000 in sales',
    icon: '💎',
    max_progress: 2000,
    category: 'sales',
    rewards: [
      {
        type: 'badge',
        value: 'revenue_generator',
        description: 'Revenue Generator Badge',
      },
    ],
  },
  {
    id: 'time_milestone_1',
    name: 'Loyal Member',
    description: 'Stay active for 30 days',
    icon: '⏰',
    max_progress: 30,
    category: 'time',
    rewards: [
      {
        type: 'badge',
        value: 'monthly_member',
        description: 'Monthly Member Badge',
      },
    ],
  },
  {
    id: 'time_milestone_2',
    name: 'Veteran Member',
    description: 'Stay active for 90 days',
    icon: '🎖️',
    max_progress: 90,
    category: 'time',
    rewards: [
      {
        type: 'badge',
        value: 'long_term_member',
        description: 'Long-term Member Badge',
      },
    ],
  },
  {
    id: 'verification_milestone',
    name: 'Trusted Member',
    description: 'Complete account verification',
    icon: '🔒',
    max_progress: 1,
    category: 'verification',
    rewards: [
      {
        type: 'badge',
        value: 'verified_member',
        description: 'Verified Member Badge',
      },
    ],
  },
]

async function seedBadges() {
  try {
    console.log('🌱 Seeding badges...')
    
    // Check if badges already exist
    const badgesRef = collection(db, 'badges')
    const existingBadges = await getDocs(badgesRef)
    
    if (!existingBadges.empty) {
      console.log('Badges already exist, skipping...')
      return
    }

    // Add badges to the badges collection
    for (const badge of INITIAL_BADGES) {
      await addDoc(badgesRef, {
        ...badge,
        created_at: new Date(),
      })
      console.log(`✅ Added badge: ${badge.name}`)
    }

    console.log('🎉 All badges seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding badges:', error)
  }
}

async function seedAchievements() {
  try {
    console.log('🏆 Seeding achievements...')
    
    // Check if achievements already exist
    const achievementsRef = collection(db, 'achievements')
    const existingAchievements = await getDocs(achievementsRef)
    
    if (!existingAchievements.empty) {
      console.log('Achievements already exist, skipping...')
      return
    }

    // Add achievements to the achievements collection
    for (const achievement of INITIAL_ACHIEVEMENTS) {
      await addDoc(achievementsRef, {
        ...achievement,
        created_at: new Date(),
      })
      console.log(`✅ Added achievement: ${achievement.name}`)
    }

    console.log('🎉 All achievements seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding achievements:', error)
  }
}

async function assignEarlyAdopterBadge() {
  try {
    console.log('🚀 Assigning early adopter badges...')
    
    // Get all users who joined before a certain date (early adopters)
    const usersRef = collection(db, 'users')
    const earlyAdopterQuery = query(
      usersRef,
      where('created_at', '<', new Date('2024-02-01')) // Adjust date as needed
    )
    const earlyAdopters = await getDocs(earlyAdopterQuery)
    
    let assignedCount = 0
    for (const userDoc of earlyAdopters.docs) {
      const userData = userDoc.data()
      const currentBadges = userData.badges || []
      
      // Check if user already has early adopter badge
      const hasEarlyAdopterBadge = currentBadges.some((badge: any) => 
        badge.id === 'early_adopter'
      )
      
      if (!hasEarlyAdopterBadge) {
        const earlyAdopterBadge = INITIAL_BADGES.find(b => b.id === 'early_adopter')
        if (earlyAdopterBadge) {
          const newBadge = {
            ...earlyAdopterBadge,
            earned_at: new Date(),
          }
          
          await userDoc.ref.update({
            badges: [...currentBadges, newBadge],
            updated_at: new Date(),
          })
          
          assignedCount++
          console.log(`✅ Assigned early adopter badge to: ${userData.full_name || userData.email}`)
        }
      }
    }
    
    console.log(`🎉 Assigned early adopter badges to ${assignedCount} users!`)
  } catch (error) {
    console.error('❌ Error assigning early adopter badges:', error)
  }
}

async function main() {
  console.log('🚀 Starting badge and achievement seeding...')
  
  await seedBadges()
  await seedAchievements()
  await assignEarlyAdopterBadge()
  
  console.log('✅ All seeding completed successfully!')
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { seedBadges, seedAchievements, assignEarlyAdopterBadge } 