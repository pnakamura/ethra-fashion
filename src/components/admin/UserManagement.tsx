import { useState } from 'react';
import { Search, MoreHorizontal, Crown, Shield, User, Eye, Ban } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserRole {
  role: 'admin' | 'moderator' | 'user';
}

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  subscription_plan_id: string | null;
  created_at: string;
  user_roles: UserRole[];
}

function RoleBadge({ role }: { role: string }) {
  const config = {
    admin: { label: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    moderator: { label: 'Mod', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    user: { label: 'User', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  };

  const { label, color } = config[role as keyof typeof config] || config.user;

  return <Badge className={color}>{label}</Badge>;
}

export function UserManagement() {
  const { promoteToAdmin, promoteToModerator, demoteToUser } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, username, avatar_url, subscription_plan_id, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles separately
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');

      // Merge data
      const usersWithRoles = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          user_roles: userRole ? [{ role: userRole.role as 'admin' | 'moderator' | 'user' }] : [],
        };
      });

      return usersWithRoles as UserProfile[];
    },
  });

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_id.toLowerCase().includes(searchQuery.toLowerCase());

    const userRole = user.user_roles?.[0]?.role || 'user';
    const matchesRole = roleFilter === 'all' || userRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleAction = async (action: string, userId: string) => {
    switch (action) {
      case 'admin':
        await promoteToAdmin(userId);
        break;
      case 'moderator':
        await promoteToModerator(userId);
        break;
      case 'demote':
        await demoteToUser(userId);
        break;
    }
    refetch();
  };

  return (
    <Card className="p-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrar role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="moderator">Moderadores</SelectItem>
            <SelectItem value="user">Usuários</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="w-[50px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const userRole = user.user_roles?.[0]?.role || 'user';
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.username || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {user.user_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.subscription_plan_id || 'free'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={userRole} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'dd/MM/yy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleAction('admin', user.user_id)}>
                            <Crown className="w-4 h-4 mr-2" /> Tornar Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction('moderator', user.user_id)}>
                            <Shield className="w-4 h-4 mr-2" /> Tornar Moderador
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction('demote', user.user_id)}>
                            <User className="w-4 h-4 mr-2" /> Remover Privilégios
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Ban className="w-4 h-4 mr-2" /> Banir Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination info */}
      <div className="mt-4 text-sm text-muted-foreground">
        Mostrando {filteredUsers.length} de {users.length} usuários
      </div>
    </Card>
  );
}
