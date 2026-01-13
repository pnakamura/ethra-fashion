import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'admin' | 'moderator' | 'user';

interface AdminHookResult {
  isAdmin: boolean;
  isModerator: boolean;
  role: AppRole;
  isLoading: boolean;
  promoteToAdmin: (userId: string) => Promise<void>;
  promoteToModerator: (userId: string) => Promise<void>;
  demoteToUser: (userId: string) => Promise<void>;
  removeRole: (userId: string) => Promise<void>;
  setupFirstAdmin: (secretKey: string) => Promise<boolean>;
}

export function useAdmin(): AdminHookResult {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userRole = 'user', isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return 'user' as AppRole;
      const { data, error } = await supabase.rpc('get_user_role', { _user_id: user.id });
      if (error) {
        console.error('Error fetching role:', error);
        return 'user' as AppRole;
      }
      return (data || 'user') as AppRole;
    },
    enabled: !!user,
  });

  const promoteToAdmin = async (userId: string) => {
    const { error } = await supabase.from('user_roles').upsert(
      {
        user_id: userId,
        role: 'admin' as const,
        granted_by: user?.id,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível promover usuário', variant: 'destructive' });
      throw error;
    }

    toast({ title: 'Sucesso', description: 'Usuário promovido a Admin' });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['user-role'] });
  };

  const promoteToModerator = async (userId: string) => {
    const { error } = await supabase.from('user_roles').upsert(
      {
        user_id: userId,
        role: 'moderator' as const,
        granted_by: user?.id,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível promover usuário', variant: 'destructive' });
      throw error;
    }

    toast({ title: 'Sucesso', description: 'Usuário promovido a Moderador' });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['user-role'] });
  };

  const demoteToUser = async (userId: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível remover privilégios', variant: 'destructive' });
      throw error;
    }

    toast({ title: 'Sucesso', description: 'Privilégios removidos' });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['user-role'] });
  };

  const removeRole = async (userId: string) => {
    return demoteToUser(userId);
  };

  const setupFirstAdmin = async (secretKey: string): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await supabase.rpc('setup_first_admin', {
      _user_id: user.id,
      _secret_key: secretKey,
    });

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao configurar admin', variant: 'destructive' });
      return false;
    }

    if (data) {
      toast({ title: 'Sucesso!', description: 'Você agora é administrador' });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
    } else {
      toast({ title: 'Erro', description: 'Chave inválida ou admin já existe', variant: 'destructive' });
    }

    return !!data;
  };

  return {
    isAdmin: userRole === 'admin',
    isModerator: userRole === 'moderator' || userRole === 'admin',
    role: userRole,
    isLoading,
    promoteToAdmin,
    promoteToModerator,
    demoteToUser,
    removeRole,
    setupFirstAdmin,
  };
}
