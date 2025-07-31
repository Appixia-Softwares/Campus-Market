import { db } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'
import { BADGE_CONFIG, type OfficialBadge, type AccountTier, type Badge, type Achievement } from '@/lib/types'

export interface BadgeService {
  // Badge Management
  getUserBadges(userId: string): Promise<Badge[]>
  addBadgeToUser(userId: string, badge: Omit<Badge, 'id' | 'earned_at'>): Promise<void>
  removeBadgeFromUser(userId: string, badgeId: string): Promise<void>
  
  // Official Account Management
  createOfficialAccount(userId: string, accountData: {
    account_type: string
    badge: OfficialBadge
    tier: AccountTier
  }): Promise<void>
  
  updateOfficialAccount(userId: string, updates: {
    badge?: OfficialBadge
    tier?: AccountTier
    is_active?: boolean
  }): Promise<void>
  
  removeOfficialAccount(userId: string): Promise<void>
  
  // Achievement Management
  getUserAchievements(userId: string): Promise<Achievement[]>
  updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<void>
  
  // Badge Criteria Checking
  checkBadgeCriteria(userId: string): Promise<Badge[]>
  checkSalesBadges(userId: string): Promise<Badge[]>
  checkVerificationBadges(userId: string): Promise<Badge[]>
  checkTimeBasedBadges(userId: string): Promise<Badge[]>
}

class BadgeServiceImpl implements BadgeService {
  
  async getUserBadges(userId: string): Promise<Badge[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }
      
      const userData = userDoc.data()
      return userData.badges || []
    } catch (error) {
      console.error('Error fetching user badges:', error)
      throw error
    }
  }

  async addBadgeToUser(userId: string, badge: Omit<Badge, 'id' | 'earned_at'>): Promise<void> {
    try {
      const newBadge: Badge = {
        ...badge,
        id: `badge_${Date.now()}`,
        earned_at: new Date(),
      }
      
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }
      
      const currentBadges = userDoc.data().badges || []
      const updatedBadges = [...currentBadges, newBadge]
      
      await updateDoc(userRef, {
        badges: updatedBadges,
        updated_at: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error adding badge to user:', error)
      throw error
    }
  }

  async removeBadgeFromUser(userId: string, badgeId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }
      
      const currentBadges = userDoc.data().badges || []
      const updatedBadges = currentBadges.filter((badge: Badge) => badge.id !== badgeId)
      
      await updateDoc(userRef, {
        badges: updatedBadges,
        updated_at: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error removing badge from user:', error)
      throw error
    }
  }

  async createOfficialAccount(userId: string, accountData: {
    account_type: string
    badge: OfficialBadge
    tier: AccountTier
  }): Promise<void> {
    try {
      // Create official account document
      await addDoc(collection(db, 'official_accounts'), {
        user_id: userId,
        account_type: accountData.account_type,
        badge: accountData.badge,
        tier: accountData.tier,
        is_active: true,
        verified_at: serverTimestamp(),
        created_at: serverTimestamp(),
      })

      // Update user document
      await updateDoc(doc(db, 'users', userId), {
        is_official_account: true,
        official_badge: accountData.badge,
        account_tier: accountData.tier,
        updated_at: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error creating official account:', error)
      throw error
    }
  }

  async updateOfficialAccount(userId: string, updates: {
    badge?: OfficialBadge
    tier?: AccountTier
    is_active?: boolean
  }): Promise<void> {
    try {
      // Update official account document
      const officialAccountsRef = collection(db, 'official_accounts')
      const q = query(officialAccountsRef, where('user_id', '==', userId))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const accountDoc = snapshot.docs[0]
        await updateDoc(accountDoc.ref, {
          ...updates,
          updated_at: serverTimestamp(),
        })
      }

      // Update user document
      const userUpdates: any = {
        updated_at: serverTimestamp(),
      }
      
      if (updates.badge) userUpdates.official_badge = updates.badge
      if (updates.tier) userUpdates.account_tier = updates.tier
      if (updates.is_active !== undefined) userUpdates.is_official_account = updates.is_active
      
      await updateDoc(doc(db, 'users', userId), userUpdates)
    } catch (error) {
      console.error('Error updating official account:', error)
      throw error
    }
  }

  async removeOfficialAccount(userId: string): Promise<void> {
    try {
      // Remove official account document
      const officialAccountsRef = collection(db, 'official_accounts')
      const q = query(officialAccountsRef, where('user_id', '==', userId))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        await deleteDoc(snapshot.docs[0].ref)
      }

      // Update user document
      await updateDoc(doc(db, 'users', userId), {
        is_official_account: false,
        official_badge: null,
        account_tier: 'free',
        updated_at: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error removing official account:', error)
      throw error
    }
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }
      
      const userData = userDoc.data()
      return userData.achievements || []
    } catch (error) {
      console.error('Error fetching user achievements:', error)
      throw error
    }
  }

  async updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }
      
      const currentAchievements = userDoc.data().achievements || []
      const updatedAchievements = currentAchievements.map((achievement: Achievement) => {
        if (achievement.id === achievementId) {
          const newProgress = Math.min(progress, achievement.max_progress)
          const completed = newProgress >= achievement.max_progress
          return {
            ...achievement,
            progress: newProgress,
            completed,
            completed_at: completed ? new Date() : achievement.completed_at,
          }
        }
        return achievement
      })
      
      await updateDoc(userRef, {
        achievements: updatedAchievements,
        updated_at: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error updating achievement progress:', error)
      throw error
    }
  }

  async checkBadgeCriteria(userId: string): Promise<Badge[]> {
    try {
      const [salesBadges, verificationBadges, timeBasedBadges] = await Promise.all([
        this.checkSalesBadges(userId),
        this.checkVerificationBadges(userId),
        this.checkTimeBasedBadges(userId),
      ])
      
      return [...salesBadges, ...verificationBadges, ...timeBasedBadges]
    } catch (error) {
      console.error('Error checking badge criteria:', error)
      throw error
    }
  }

  async checkSalesBadges(userId: string): Promise<Badge[]> {
    try {
      const newBadges: Badge[] = []
      
      // Get user's sales data
      const ordersQuery = query(
        collection(db, 'orders'),
        where('seller_id', '==', userId),
        where('status', '==', 'completed')
      )
      const ordersSnapshot = await getDocs(ordersQuery)
      const totalSales = ordersSnapshot.size
      const totalRevenue = ordersSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().total_amount || 0)
      }, 0)

      // Check for sales-based badges
      if (totalSales >= 10 && totalSales < 50) {
        newBadges.push({
          id: `badge_${Date.now()}_1`,
          name: 'Active Seller',
          description: 'Completed 10+ sales',
          icon: '🛍️',
          color: 'bg-blue-500',
          category: 'sales',
          earned_at: new Date(),
          criteria: {
            type: 'sales_count',
            value: 10,
            description: 'Complete 10 sales',
          },
        })
      }

      if (totalSales >= 50) {
        newBadges.push({
          id: `badge_${Date.now()}_2`,
          name: 'Top Seller',
          description: 'Completed 50+ sales',
          icon: '🏆',
          color: 'bg-yellow-500',
          category: 'sales',
          earned_at: new Date(),
          criteria: {
            type: 'sales_count',
            value: 50,
            description: 'Complete 50 sales',
          },
        })
      }

      if (totalRevenue >= 1000) {
        newBadges.push({
          id: `badge_${Date.now()}_3`,
          name: 'Revenue Generator',
          description: 'Generated $1000+ in sales',
          icon: '💰',
          color: 'bg-green-500',
          category: 'sales',
          earned_at: new Date(),
          criteria: {
            type: 'sales_count',
            value: 1000,
            description: 'Generate $1000 in sales',
          },
        })
      }

      return newBadges
    } catch (error) {
      console.error('Error checking sales badges:', error)
      return []
    }
  }

  async checkVerificationBadges(userId: string): Promise<Badge[]> {
    try {
      const newBadges: Badge[] = []
      
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        return newBadges
      }
      
      const userData = userDoc.data()
      
      // Check for verification badges
      if (userData.verified && !userData.badges?.some((b: Badge) => b.name === 'Verified Member')) {
        newBadges.push({
          id: `badge_${Date.now()}_4`,
          name: 'Verified Member',
          description: 'Account verified by Campus Market',
          icon: '✓',
          color: 'bg-green-500',
          category: 'verification',
          earned_at: new Date(),
          criteria: {
            type: 'verification',
            description: 'Account verification completed',
          },
        })
      }

      if (userData.email_verified && !userData.badges?.some((b: Badge) => b.name === 'Email Verified')) {
        newBadges.push({
          id: `badge_${Date.now()}_5`,
          name: 'Email Verified',
          description: 'Email address verified',
          icon: 'Mail',
          color: 'bg-blue-500',
          category: 'verification',
          earned_at: new Date(),
          criteria: {
            type: 'verification',
            description: 'Email verification completed',
          },
        })
      }

      return newBadges
    } catch (error) {
      console.error('Error checking verification badges:', error)
      return []
    }
  }

  async checkTimeBasedBadges(userId: string): Promise<Badge[]> {
    try {
      const newBadges: Badge[] = []
      
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        return newBadges
      }
      
      const userData = userDoc.data()
      const memberSince = userData.created_at?.toDate() || new Date()
      const daysActive = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))

      // Check for time-based badges
      if (daysActive >= 30 && daysActive < 90) {
        newBadges.push({
          id: `badge_${Date.now()}_6`,
          name: 'Monthly Member',
          description: 'Active for 30+ days',
          icon: '📅',
          color: 'bg-purple-500',
          category: 'achievement',
          earned_at: new Date(),
          criteria: {
            type: 'time_active',
            value: 30,
            description: 'Active for 30 days',
          },
        })
      }

      if (daysActive >= 90) {
        newBadges.push({
          id: `badge_${Date.now()}_7`,
          name: 'Long-term Member',
          description: 'Active for 90+ days',
          icon: '🎖️',
          color: 'bg-orange-500',
          category: 'achievement',
          earned_at: new Date(),
          criteria: {
            type: 'time_active',
            value: 90,
            description: 'Active for 90 days',
          },
        })
      }

      return newBadges
    } catch (error) {
      console.error('Error checking time-based badges:', error)
      return []
    }
  }
}

export const badgeService = new BadgeServiceImpl() 