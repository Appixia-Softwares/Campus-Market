'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserBadgeDisplay, OfficialBadgeDisplay } from '@/components/ui/badge-display'
import { BADGE_CONFIG, ACCOUNT_TIER_BENEFITS, type OfficialBadge, type AccountTier } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { toast } from '@/hooks/use-toast'
import { Search, Plus, Shield, Crown, Star, Users, Settings, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react'

interface OfficialAccount {
  id: string
  user_id: string
  user_email: string
  user_name: string
  account_type: string
  badge: OfficialBadge
  tier: AccountTier
  is_active: boolean
  verified_at: Date
  expires_at?: Date
  created_at: Date
}

export default function OfficialAccountsPage() {
  const [accounts, setAccounts] = useState<OfficialAccount[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<OfficialAccount | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchOfficialAccounts()
    fetchUsers()
  }, [])

  const fetchOfficialAccounts = async () => {
    try {
      const accountsRef = collection(db, 'official_accounts')
      const q = query(accountsRef)
      const snapshot = await getDocs(q)
      const accountsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OfficialAccount[]
      setAccounts(accountsData)
    } catch (error) {
      console.error('Error fetching official accounts:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch official accounts',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users')
      const snapshot = await getDocs(usersRef)
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setUsers(usersData)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const createOfficialAccount = async (accountData: Partial<OfficialAccount>) => {
    try {
      const accountRef = await addDoc(collection(db, 'official_accounts'), {
        ...accountData,
        created_at: new Date(),
        verified_at: new Date(),
        is_active: true,
      })

      // Update user document with official account info
      await updateDoc(doc(db, 'users', accountData.user_id!), {
        is_official_account: true,
        official_badge: accountData.badge,
        account_tier: accountData.tier,
      })

      toast({
        title: 'Success',
        description: 'Official account created successfully',
      })

      fetchOfficialAccounts()
      setDialogOpen(false)
    } catch (error) {
      console.error('Error creating official account:', error)
      toast({
        title: 'Error',
        description: 'Failed to create official account',
        variant: 'destructive',
      })
    }
  }

  const updateOfficialAccount = async (accountId: string, updates: Partial<OfficialAccount>) => {
    try {
      await updateDoc(doc(db, 'official_accounts', accountId), updates)
      
      // Update user document if badge or tier changed
      if (updates.badge || updates.tier) {
        await updateDoc(doc(db, 'users', selectedAccount!.user_id), {
          official_badge: updates.badge,
          account_tier: updates.tier,
        })
      }

      toast({
        title: 'Success',
        description: 'Official account updated successfully',
      })

      fetchOfficialAccounts()
      setDialogOpen(false)
    } catch (error) {
      console.error('Error updating official account:', error)
      toast({
        title: 'Error',
        description: 'Failed to update official account',
        variant: 'destructive',
      })
    }
  }

  const deactivateAccount = async (accountId: string) => {
    try {
      await updateDoc(doc(db, 'official_accounts', accountId), {
        is_active: false,
      })

      toast({
        title: 'Success',
        description: 'Account deactivated successfully',
      })

      fetchOfficialAccounts()
    } catch (error) {
      console.error('Error deactivating account:', error)
      toast({
        title: 'Error',
        description: 'Failed to deactivate account',
        variant: 'destructive',
      })
    }
  }

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || account.account_type === filterType
    return matchesSearch && matchesFilter
  })

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'campus_market_official': return <Crown className="h-4 w-4" />
      case 'verified_seller': return <CheckCircle className="h-4 w-4" />
      case 'premium_member': return <Star className="h-4 w-4" />
      case 'moderator': return <Shield className="h-4 w-4" />
      case 'admin': return <Settings className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading official accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Official Accounts</h1>
          <p className="text-muted-foreground">
            Manage official Campus Market accounts and badges
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Official Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Official Account</DialogTitle>
              <DialogDescription>
                Grant official status to a user with specific badges and permissions.
              </DialogDescription>
            </DialogHeader>
            <CreateOfficialAccountForm 
              users={users}
              onSubmit={createOfficialAccount}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>
            View and manage all official accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="campus_market_official">Official</SelectItem>
                <SelectItem value="verified_seller">Verified Seller</SelectItem>
                <SelectItem value="premium_member">Premium Member</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredAccounts.map((account) => (
              <Card key={account.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>
                        {account.user_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{account.user_name}</h3>
                        <Badge variant={account.is_active ? "default" : "secondary"}>
                          {account.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{account.user_email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getAccountTypeIcon(account.account_type)}
                        <span className="text-sm font-medium">{account.account_type.replace('_', ' ')}</span>
                        <OfficialBadgeDisplay badge={account.badge} size="sm" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAccount(account)
                        setDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deactivateAccount(account.id)}
                      disabled={!account.is_active}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredAccounts.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No official accounts found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create the first official account to get started'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {selectedAccount && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Official Account</DialogTitle>
              <DialogDescription>
                Update account type, badge, and tier for {selectedAccount.user_name}
              </DialogDescription>
            </DialogHeader>
            <EditOfficialAccountForm 
              account={selectedAccount}
              onSubmit={(updates) => updateOfficialAccount(selectedAccount.id, updates)}
              onCancel={() => {
                setSelectedAccount(null)
                setDialogOpen(false)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Create Official Account Form Component
function CreateOfficialAccountForm({ 
  users, 
  onSubmit, 
  onCancel 
}: { 
  users: any[]
  onSubmit: (data: Partial<OfficialAccount>) => void
  onCancel: () => void
}) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [accountType, setAccountType] = useState('campus_market_official')
  const [badge, setBadge] = useState<OfficialBadge>('campus_market_official')
  const [tier, setTier] = useState<AccountTier>('official')

  const selectedUser = users.find(u => u.id === selectedUserId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return

    onSubmit({
      user_id: selectedUserId,
      user_email: selectedUser?.email,
      user_name: selectedUser?.full_name,
      account_type: accountType,
      badge,
      tier,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="user">Select User</Label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a user" />
          </SelectTrigger>
          <SelectContent>
            {users
              .filter(user => !user.is_official_account)
              .map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="accountType">Account Type</Label>
        <Select value={accountType} onValueChange={setAccountType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="campus_market_official">Campus Market Official</SelectItem>
            <SelectItem value="verified_seller">Verified Seller</SelectItem>
            <SelectItem value="premium_member">Premium Member</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="badge">Official Badge</Label>
        <Select value={badge} onValueChange={(value) => setBadge(value as OfficialBadge)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BADGE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <span>{config.icon}</span>
                  <span>{config.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="tier">Account Tier</Label>
        <Select value={tier} onValueChange={(value) => setTier(value as AccountTier)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ACCOUNT_TIER_BENEFITS).map(([key, tier]) => (
              <SelectItem key={key} value={key}>
                {tier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!selectedUserId}>
          Create Official Account
        </Button>
      </DialogFooter>
    </form>
  )
}

// Edit Official Account Form Component
function EditOfficialAccountForm({ 
  account, 
  onSubmit, 
  onCancel 
}: { 
  account: OfficialAccount
  onSubmit: (updates: Partial<OfficialAccount>) => void
  onCancel: () => void
}) {
  const [accountType, setAccountType] = useState(account.account_type)
  const [badge, setBadge] = useState<OfficialBadge>(account.badge)
  const [tier, setTier] = useState<AccountTier>(account.tier)
  const [isActive, setIsActive] = useState(account.is_active)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      account_type: accountType,
      badge,
      tier,
      is_active: isActive,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
        <Avatar className="h-12 w-12">
          <AvatarImage src="/placeholder-user.jpg" />
          <AvatarFallback>
            {account.user_name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{account.user_name}</h3>
          <p className="text-sm text-muted-foreground">{account.user_email}</p>
        </div>
      </div>

      <div>
        <Label htmlFor="accountType">Account Type</Label>
        <Select value={accountType} onValueChange={setAccountType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="campus_market_official">Campus Market Official</SelectItem>
            <SelectItem value="verified_seller">Verified Seller</SelectItem>
            <SelectItem value="premium_member">Premium Member</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="badge">Official Badge</Label>
        <Select value={badge} onValueChange={(value) => setBadge(value as OfficialBadge)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BADGE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <span>{config.icon}</span>
                  <span>{config.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="tier">Account Tier</Label>
        <Select value={tier} onValueChange={(value) => setTier(value as AccountTier)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ACCOUNT_TIER_BENEFITS).map(([key, tier]) => (
              <SelectItem key={key} value={key}>
                {tier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="isActive">Active Account</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Update Account
        </Button>
      </DialogFooter>
    </form>
  )
} 