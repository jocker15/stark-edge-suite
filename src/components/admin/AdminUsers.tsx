import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, UserX, Ban, UnlockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface UserWithRoles {
  id: number;
  user_id: string;
  email: string | null;
  username: string | null;
  created_at: string;
  is_blocked: boolean;
  roles: string[];
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить пользователей",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Get all user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить роли пользователей",
        variant: "destructive",
      });
    }

    // Combine profiles with roles
    const usersWithRoles = profiles?.map(profile => ({
      ...profile,
      roles: userRoles?.filter(r => r.user_id === profile.user_id).map(r => r.role) || []
    })) || [];

    setUsers(usersWithRoles);
    setLoading(false);
  }

  async function toggleRole(userId: string, role: 'admin' | 'moderator' | 'user', hasRole: boolean) {
    if (hasRole) {
      // Remove role
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить роль",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Успешно",
          description: "Роль удалена",
        });
        loadUsers();
      }
    } else {
      // Add role
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role }]);

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось добавить роль",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Успешно",
          description: "Роль добавлена",
        });
        loadUsers();
      }
    }
  }

  async function toggleBlockUser(userId: string, isBlocked: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_blocked: !isBlocked })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус блокировки",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно",
        description: isBlocked ? "Пользователь разблокирован" : "Пользователь заблокирован",
      });
      loadUsers();
    }
  }

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление пользователями</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Поиск по email, имени или ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Пользователей не найдено
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Имя пользователя</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Роли</TableHead>
                  <TableHead>Дата регистрации</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const hasAdmin = user.roles.includes('admin');
                  const hasModerator = user.roles.includes('moderator');
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">
                        {user.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{user.email || "—"}</TableCell>
                      <TableCell>{user.username || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_blocked ? "destructive" : "default"}>
                          {user.is_blocked ? "Заблокирован" : "Активен"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.length === 0 && (
                            <Badge variant="secondary">user</Badge>
                          )}
                          {user.roles.map(role => (
                            <Badge 
                              key={role}
                              variant={role === 'admin' ? 'default' : 'secondary'}
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant={hasAdmin ? "default" : "outline"}
                            onClick={() => toggleRole(user.user_id, 'admin', hasAdmin)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Admin
                          </Button>
                          <Button
                            size="sm"
                            variant={hasModerator ? "default" : "outline"}
                            onClick={() => toggleRole(user.user_id, 'moderator', hasModerator)}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Mod
                          </Button>
                          <Button
                            size="sm"
                            variant={user.is_blocked ? "outline" : "destructive"}
                            onClick={() => toggleBlockUser(user.user_id, user.is_blocked)}
                          >
                            {user.is_blocked ? (
                              <UnlockKeyhole className="h-4 w-4 mr-1" />
                            ) : (
                              <Ban className="h-4 w-4 mr-1" />
                            )}
                            {user.is_blocked ? "Разблок" : "Блок"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
