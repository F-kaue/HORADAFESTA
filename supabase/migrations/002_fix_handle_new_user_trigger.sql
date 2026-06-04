-- Corrige trigger de criação de perfil ao registrar usuário no Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuária'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Service and trigger can insert profiles" ON public.profiles;
CREATE POLICY "Service and trigger can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);
