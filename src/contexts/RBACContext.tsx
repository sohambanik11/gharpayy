import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'manager' | 'agent' | 'owner';

interface RBACContextType {
  roles: AppRole[];
  isAdmin: boolean;
  isManager: boolean;
  isAgent: boolean;
  isOwner: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  loading: boolean;
}

const RBACContext = createContext<RBACContextType>({
  roles: [],
  isAdmin: false,
  isManager: false,
  isAgent: false,
  isOwner: false,
  hasRole: () => false,
  hasAnyRole: () => false,
  loading: true,
});

export const RBACProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to fetch roles:', error);
        // Fallback: check agents table for legacy role assignment
        const { data: agentData } = await supabase
          .from('agents')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (agentData?.role) {
          setRoles([agentData.role as AppRole]);
        }
      } else {
        setRoles((data || []).map(r => r.role as AppRole));
      }
      setLoading(false);
    };

    fetchRoles();
  }, [user]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const hasAnyRole = (checkRoles: AppRole[]) => checkRoles.some(r => roles.includes(r));

  return (
    <RBACContext.Provider
      value={{
        roles,
        isAdmin: hasRole('admin'),
        isManager: hasRole('manager'),
        isAgent: hasRole('agent'),
        isOwner: hasRole('owner'),
        hasRole,
        hasAnyRole,
        loading,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = () => useContext(RBACContext);

// HOC for role-gated components
export const RoleGate = ({
  roles,
  children,
  fallback = null,
}: {
  roles: AppRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  const { hasAnyRole, loading } = useRBAC();
  if (loading) return null;
  if (!hasAnyRole(roles)) return <>{fallback}</>;
  return <>{children}</>;
};
