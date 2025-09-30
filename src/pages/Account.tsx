import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

export default function Account() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          // Fetch profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (profileError) {
            console.error('Error fetching profile:', profileError)
          } else {
            setProfile(profileData)
          }

          // Fetch orders
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('id, created_at, amount, order_details, status')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (orderError) {
            console.error('Error fetching orders:', orderError)
          } else {
            setOrders(orderData || [])
          }
        } catch (error) {
          console.error('Error fetching data:', error)
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    } else {
      setProfile(null)
      setOrders([])
      setLoading(false)
    }
  }, [user])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive'
      })
      return
    }

    setPasswordLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Success',
          description: 'Password updated successfully'
        })
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update password',
        variant: 'destructive'
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      completed: { variant: 'default' as const, label: 'Completed' },
      failed: { variant: 'destructive' as const, label: 'Failed' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <p>Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="space-y-8">
          <h1 className="text-4xl font-heading text-gradient-primary">
            MY ACCOUNT
          </h1>
          {user ? (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="text-lg font-medium">{user.email}</p>
                    </div>
                    {profile?.username && (
                      <div>
                        <Label className="text-muted-foreground">Username</Label>
                        <p className="text-lg font-medium">{profile.username}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="bg-background/50"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-primary hover:opacity-90"
                        disabled={passwordLoading}
                      >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Purchase History */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase History</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order: any) => (
                        <div key={order.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Order #{order.id}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleString()}
                              </p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="space-y-2">
                            {(order.order_details as any[]).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span>{item.name_en} x {item.quantity}</span>
                                <span className="font-medium">${(item.price || 0).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t flex justify-between items-center font-semibold">
                            <span>Total</span>
                            <span>${(order.amount || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No purchases yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Please log in to view your account.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}