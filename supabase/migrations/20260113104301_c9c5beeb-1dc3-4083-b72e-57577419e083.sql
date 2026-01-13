-- 1. Criar enum para roles de admin
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Tabela de planos de assinatura
CREATE TABLE public.subscription_plans (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  badge_color TEXT DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Inserir os 4 tiers de assinatura IMEDIATAMENTE após criar a tabela
INSERT INTO public.subscription_plans (id, display_name, description, price_monthly, price_yearly, badge_color, sort_order) VALUES
  ('free', 'Iniciante', 'Comece sua jornada de estilo', 0, 0, '#9CA3AF', 0),
  ('trendsetter', 'Trendsetter', 'Expanda seu closet digital', 29.90, 299.00, '#3B82F6', 1),
  ('icon', 'Icon', 'Acesso completo ao provador virtual', 59.90, 599.00, '#8B5CF6', 2),
  ('muse', 'Muse', 'Experiência ilimitada e exclusiva', 99.90, 999.00, '#F59E0B', 3);

-- 4. Tabela de limites por plano (ESCALÁVEL)
CREATE TABLE public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  limit_type TEXT NOT NULL CHECK (limit_type IN ('count', 'boolean', 'tier')),
  limit_value INTEGER NOT NULL,
  feature_display_name TEXT,
  UNIQUE(plan_id, feature_key)
);

-- 5. Inserir limites para todos os planos
INSERT INTO public.plan_limits (plan_id, feature_key, limit_type, limit_value, feature_display_name) VALUES
  ('free', 'avatars', 'count', 1, 'Avatares'),
  ('free', 'wardrobe_slots', 'count', 10, 'Peças no Closet'),
  ('free', 'trips', 'boolean', 0, 'Planejador de Viagens'),
  ('free', 'vip_looks', 'boolean', 0, 'Looks Exclusivos'),
  ('free', 'try_on_daily', 'count', 3, 'Provas Virtuais/dia'),
  ('trendsetter', 'avatars', 'count', 3, 'Avatares'),
  ('trendsetter', 'wardrobe_slots', 'count', 50, 'Peças no Closet'),
  ('trendsetter', 'trips', 'boolean', 0, 'Planejador de Viagens'),
  ('trendsetter', 'vip_looks', 'boolean', 0, 'Looks Exclusivos'),
  ('trendsetter', 'try_on_daily', 'count', 10, 'Provas Virtuais/dia'),
  ('icon', 'avatars', 'count', -1, 'Avatares'),
  ('icon', 'wardrobe_slots', 'count', 200, 'Peças no Closet'),
  ('icon', 'trips', 'boolean', 1, 'Planejador de Viagens'),
  ('icon', 'vip_looks', 'boolean', 0, 'Looks Exclusivos'),
  ('icon', 'try_on_daily', 'count', 30, 'Provas Virtuais/dia'),
  ('muse', 'avatars', 'count', -1, 'Avatares'),
  ('muse', 'wardrobe_slots', 'count', -1, 'Peças no Closet'),
  ('muse', 'trips', 'boolean', 1, 'Planejador de Viagens'),
  ('muse', 'vip_looks', 'boolean', 1, 'Looks Exclusivos'),
  ('muse', 'try_on_daily', 'count', -1, 'Provas Virtuais/dia');

-- 6. Tabela de roles de usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id)
);

-- 7. Adicionar colunas de subscription ao profiles (agora os planos existem)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan_id TEXT REFERENCES public.subscription_plans(id) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- 8. Enable RLS em todas as tabelas
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 9. Função SECURITY DEFINER para checar roles (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 10. Função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1),
    'user'::app_role
  )
$$;

-- 11. RLS Policies para subscription_plans
CREATE POLICY "Plans are viewable by authenticated users" 
ON public.subscription_plans FOR SELECT TO authenticated USING (true);

-- 12. RLS Policies para plan_limits
CREATE POLICY "Plan limits are viewable by authenticated users" 
ON public.plan_limits FOR SELECT TO authenticated USING (true);

-- 13. RLS Policies para user_roles
CREATE POLICY "Users can view own role" 
ON public.user_roles FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" 
ON public.user_roles FOR INSERT TO authenticated 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" 
ON public.user_roles FOR UPDATE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles FOR DELETE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 14. Policies de admin para tabelas existentes
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all wardrobe items" 
ON public.wardrobe_items FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all outfits" 
ON public.outfits FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all avatars" 
ON public.user_avatars FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all trips" 
ON public.trips FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all try on results" 
ON public.try_on_results FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 15. Função segura para setup do primeiro admin
CREATE OR REPLACE FUNCTION public.setup_first_admin(_user_id UUID, _secret_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN FALSE;
  END IF;
  
  IF _secret_key != 'ETHRA_ADMIN_SETUP_2024' THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin');
  
  RETURN TRUE;
END;
$$;