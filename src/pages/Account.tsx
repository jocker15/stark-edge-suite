import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function Account() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
            .select('id, created_at, amount, order_details')
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
            <div className="space-y-8">
              {/* Profile Information */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Profile Information</h2>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> {user.email}</p>
                    {profile?.username && <p><strong>Username:</strong> {profile.username}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Purchase History */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Purchase History</h2>
                  {orders.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.flatMap((order: any) =>
                          (order.order_details as any[]).map((item: any, idx: number) => (
                            <TableRow key={`${order.id}-${idx}`}>
                              <TableCell>{idx === 0 ? new Date(order.created_at).toLocaleDateString() : ''}</TableCell>
                              <TableCell>{item.name_en}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${(item.price || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">No purchases yet.</p>
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