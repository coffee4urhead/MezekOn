import { AppwriteException, ID, Query } from 'appwrite';
import { useCallback, useEffect, useState } from 'react';
import { databases } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_ROLES || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for user roles');
}

type UserRole = 'explorer' | 'scholar' | 'guardian' | 'contributor' | 'admin' | 'keeper' | 'narrator' | 'curator' | 'collector';

interface UserRoleData {
  user_id: string;
  region_for_role: string | null;
  unlocked_at: Date;
  is_active: boolean;
  role: UserRole;
  documentId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RolePermissions {
  canSubmitWords: boolean;
  canEditWords: boolean;
  canVerifyWords: boolean;
  canManageUsers: boolean;
  canAssignRoles: boolean;
  canAccessAdminPanel: boolean;
  canViewReports: boolean;
  canManageRegions: boolean;
}

interface UseUserRolesReturn {
  roles: UserRoleData[];
  activeRoles: UserRoleData[];
  loading: boolean;
  error: AppwriteException | null;
  isUpdating: boolean;
  fetchUserRoles: () => Promise<void>;
  assignRole: (role: UserRole, region?: string) => Promise<UserRoleData>;
  revokeRole: (roleId: string) => Promise<void>;
  deactivateRole: (roleId: string) => Promise<void>;
  activateRole: (roleId: string) => Promise<void>;
  hasRole: (role: UserRole, checkActive?: boolean) => boolean;
  hasAnyRole: (roles: UserRole[], checkActive?: boolean) => boolean;
  hasAllRoles: (roles: UserRole[], checkActive?: boolean) => boolean;
  getRolesByRegion: (region: string) => UserRoleData[];
  getHighestRole: () => UserRoleData | null;
  getRolePermissions: (role?: UserRole) => RolePermissions;
  getRoleHierarchyLevel: (role: UserRole) => number;
  isAtLeastRole: (minRole: UserRole) => boolean;
  canPerformAction: (action: 'submit' | 'edit' | 'verify' | 'manage_users' | 'assign_roles' | 'admin_access' | 'view_reports' | 'manage_regions') => boolean;
  resetError: () => void;
  refresh: () => Promise<void>;
}

export function useUserRoles(user_id: string): UseUserRolesReturn {
  const [roles, setRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUserRoles = useCallback(async () => {
    if (!user_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('user_id', user_id)]
      );

      const rolesData: UserRoleData[] = response.documents.map(doc => ({
        user_id: doc.user_id,
        region_for_role: doc.region_for_role || null,
        unlocked_at: new Date(doc.unlocked_at),
        is_active: doc.is_active,
        role: doc.role,
        documentId: doc.$id,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt
      }));

      setRoles(rolesData);
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching user roles:', appwriteError.message);
      setError(appwriteError);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  const assignRole = useCallback(async (role: UserRole, region?: string): Promise<UserRoleData> => {
    try {
      setIsUpdating(true);
      setError(null);

      const existingRole = roles.find(r => r.role === role && r.region_for_role === (region || null));
      if (existingRole) {
        throw new Error(`User already has the role ${role}${region ? ` for region ${region}` : ''}`);
      }

      const newDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          user_id: user_id,
          region_for_role: region || null,
          unlocked_at: new Date().toISOString(),
          is_active: true,
          role: role
        }
      );

      const newRole: UserRoleData = {
        user_id: newDoc.user_id,
        region_for_role: newDoc.region_for_role || null,
        unlocked_at: new Date(newDoc.unlocked_at),
        is_active: newDoc.is_active,
        role: newDoc.role,
        documentId: newDoc.$id,
        createdAt: newDoc.$createdAt,
        updatedAt: newDoc.$updatedAt
      };

      setRoles(prev => [...prev, newRole]);

      return newRole;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error assigning role:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [user_id, roles]);

  const revokeRole = useCallback(async (roleId: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        roleId
      );

      setRoles(prev => prev.filter(role => role.documentId !== roleId));
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error revoking role:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deactivateRole = useCallback(async (roleId: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        roleId,
        { is_active: false }
      );

      setRoles(prev => prev.map(role =>
        role.documentId === roleId
          ? { ...role, is_active: false, updatedAt: updated.$updatedAt }
          : role
      ));
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error deactivating role:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const activateRole = useCallback(async (roleId: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        roleId,
        { is_active: true }
      );

      setRoles(prev => prev.map(role =>
        role.documentId === roleId
          ? { ...role, is_active: true, updatedAt: updated.$updatedAt }
          : role
      ));
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error activating role:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const resetError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    await fetchUserRoles();
  }, [fetchUserRoles]);

  const hasRole = useCallback((role: UserRole, checkActive: boolean = true) => {
    return roles.some(r => r.role === role && (!checkActive || r.is_active));
  }, [roles]);

  const hasAnyRole = useCallback((roleList: UserRole[], checkActive: boolean = true) => {
    return roleList.some(role => hasRole(role, checkActive));
  }, [hasRole]);

  const hasAllRoles = useCallback((roleList: UserRole[], checkActive: boolean = true) => {
    return roleList.every(role => hasRole(role, checkActive));
  }, [hasRole]);

  const getRolesByRegion = useCallback((region: string) => {
    return roles.filter(role => role.region_for_role === region);
  }, [roles]);

  const getHighestRole = useCallback((): UserRoleData | null => {
    const roleHierarchy: Record<UserRole, number> = {
      'explorer': 10,
      'guardian': 80,
      'contributor': 40,
      'admin': 100,
      'keeper': 55,
      'narrator': 20,
      'curator': 85,
      'collector': 50,
      "scholar": 90
    };

    const activeRoles = roles.filter(r => r.is_active);
    if (activeRoles.length === 0) return null;

    return activeRoles.reduce((highest, current) => {
      const currentLevel = roleHierarchy[current.role] || 0;
      const highestLevel = roleHierarchy[highest.role] || 0;
      return currentLevel > highestLevel ? current : highest;
    });
  }, [roles]);

  const getRolePermissions = useCallback((role?: UserRole): RolePermissions => {
    const roleToCheck = role || getHighestRole()?.role;

    switch(roleToCheck) {
      case 'admin':
        return {
          canSubmitWords: true,
          canEditWords: true,
          canVerifyWords: true,
          canManageUsers: true,
          canAssignRoles: true,
          canAccessAdminPanel: true,
          canViewReports: true,
          canManageRegions: true
        };
      case 'scholar':
        return {
          canSubmitWords: true,
          canEditWords: true,
          canVerifyWords: true,
          canManageUsers: true,
          canAssignRoles: false,
          canAccessAdminPanel: true,
          canViewReports: true,
          canManageRegions: true
        };
      case 'curator':
        return {
          canSubmitWords: true,
          canEditWords: true,
          canVerifyWords: true,
          canManageUsers: false,
          canAssignRoles: false,
          canAccessAdminPanel: false,
          canViewReports: true,
          canManageRegions: false
        };
      case 'guardian':
        return {
          canSubmitWords: true,
          canEditWords: true,
          canVerifyWords: true,
          canManageUsers: false,
          canAssignRoles: false,
          canAccessAdminPanel: false,
          canViewReports: false,
          canManageRegions: true
        };
      case 'keeper':
        return {
          canSubmitWords: true,
          canEditWords: true,
          canVerifyWords: false,
          canManageUsers: false,
          canAssignRoles: false,
          canAccessAdminPanel: false,
          canViewReports: false,
          canManageRegions: false
        };
      case 'collector':
        return {
          canSubmitWords: true,
          canEditWords: true,
          canVerifyWords: false,
          canManageUsers: false,
          canAssignRoles: false,
          canAccessAdminPanel: false,
          canViewReports: false,
          canManageRegions: false
        };
      case 'contributor':
        return {
          canSubmitWords: true,
          canEditWords: false,
          canVerifyWords: false,
          canManageUsers: false,
          canAssignRoles: false,
          canAccessAdminPanel: false,
          canViewReports: false,
          canManageRegions: false
        };
      case 'narrator':
        return {
          canSubmitWords: true,
          canEditWords: false,
          canVerifyWords: false,
          canManageUsers: false,
          canAssignRoles: false,
          canAccessAdminPanel: false,
          canViewReports: false,
          canManageRegions: false
        };
      case 'explorer':
        return {
          canSubmitWords: true,
          canEditWords: false,
          canVerifyWords: false,
          canManageUsers: false,
          canAssignRoles: false,
          canAccessAdminPanel: false,
          canViewReports: false,
          canManageRegions: false
        };
      default:
        return {
          canSubmitWords: false,
          canEditWords: false,
          canVerifyWords: false,
          canManageUsers: false,
          canAssignRoles: false,
          canAccessAdminPanel: false,
          canViewReports: false,
          canManageRegions: false
        };
    }
  }, [getHighestRole]);

  const getRoleHierarchyLevel = useCallback((role: UserRole): number => {
    const hierarchy: Record<UserRole, number> = {
      'explorer': 10,
      'guardian': 80,
      'contributor': 40,
      'admin': 100,
      'keeper': 55,
      'narrator': 20,
      'curator': 85,
      'collector': 50,
      "scholar": 90
    };
    return hierarchy[role] || 0;
  }, []);

  const isAtLeastRole = useCallback((minRole: UserRole): boolean => {
    const highestRole = getHighestRole();
    if (!highestRole) return false;

    const userLevel = getRoleHierarchyLevel(highestRole.role);
    const requiredLevel = getRoleHierarchyLevel(minRole);

    return userLevel >= requiredLevel;
  }, [getHighestRole, getRoleHierarchyLevel]);

  const canPerformAction = useCallback((action: 'submit' | 'edit' | 'verify' | 'manage_users' | 'assign_roles' | 'admin_access' | 'view_reports' | 'manage_regions'): boolean => {
    const permissions = getRolePermissions();

    switch(action) {
      case 'submit':
        return permissions.canSubmitWords;
      case 'edit':
        return permissions.canEditWords;
      case 'verify':
        return permissions.canVerifyWords;
      case 'manage_users':
        return permissions.canManageUsers;
      case 'assign_roles':
        return permissions.canAssignRoles;
      case 'admin_access':
        return permissions.canAccessAdminPanel;
      case 'view_reports':
        return permissions.canViewReports;
      case 'manage_regions':
        return permissions.canManageRegions;
      default:
        return false;
    }
  }, [getRolePermissions]);

  const activeRoles = roles.filter(role => role.is_active);

  useEffect(() => {
    fetchUserRoles();
  }, [fetchUserRoles]);

  return {
    roles,
    activeRoles,
    loading,
    error,
    isUpdating,
    fetchUserRoles,
    assignRole,
    revokeRole,
    deactivateRole,
    activateRole,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getRolesByRegion,
    getHighestRole,
    getRolePermissions,
    getRoleHierarchyLevel,
    isAtLeastRole,
    canPerformAction,
    resetError,
    refresh
  };
}