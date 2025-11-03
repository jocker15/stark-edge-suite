import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Role = "super_admin" | "admin" | "moderator" | "user";

export interface RolePermissions {
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewAuditLogs: boolean;
  canViewLoginEvents: boolean;
  canModerateReviews: boolean;
  canAccessDashboard: boolean;
  canAccessSecurityCenter: boolean;
  canManageSettings: boolean;
}

export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<RolePermissions>({
    canManageProducts: false,
    canManageOrders: false,
    canManageUsers: false,
    canManageRoles: false,
    canViewAuditLogs: false,
    canViewLoginEvents: false,
    canModerateReviews: false,
    canAccessDashboard: false,
    canAccessSecurityCenter: false,
    canManageSettings: false
  });

  useEffect(() => {
    async function fetchRoles() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) throw error;

        const userRoles = (data?.map(r => r.role as Role) || []);
        setRoles(userRoles);

        const hasSuperAdmin = userRoles.includes("super_admin");
        const hasAdmin = userRoles.includes("admin");
        const hasModerator = userRoles.includes("moderator");

        setPermissions({
          canManageProducts: hasSuperAdmin || hasAdmin,
          canManageOrders: hasSuperAdmin || hasAdmin,
          canManageUsers: hasSuperAdmin || hasAdmin,
          canManageRoles: hasSuperAdmin,
          canViewAuditLogs: hasSuperAdmin,
          canViewLoginEvents: hasSuperAdmin || hasAdmin,
          canModerateReviews: hasSuperAdmin || hasAdmin || hasModerator,
          canAccessDashboard: hasSuperAdmin || hasAdmin,
          canAccessSecurityCenter: hasSuperAdmin || hasAdmin,
          canManageSettings: hasSuperAdmin
        });
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, [user]);

  const hasRole = (role: Role): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (checkRoles: Role[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  };

  const hasAllRoles = (checkRoles: Role[]): boolean => {
    return checkRoles.every(role => roles.includes(role));
  };

  const isSuperAdmin = hasRole("super_admin");
  const isAdmin = hasRole("admin") || isSuperAdmin;
  const isModerator = hasRole("moderator") || isAdmin;

  return {
    roles,
    loading,
    permissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isSuperAdmin,
    isAdmin,
    isModerator
  };
}
