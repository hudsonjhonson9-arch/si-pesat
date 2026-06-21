import { RolePermission } from '../types';

export class PermissionChecker {
  private rolePermissions: RolePermission[] = [];
  private userRoleId: number | null = null;
  private userBidangId: number | null = null;
  private isAdmin: boolean = false;

  setRolePermissions(rp: RolePermission[]) {
    this.rolePermissions = rp;
  }

  setUser(roleId: number | null, bidangId: number | null, isAdmin: boolean = false) {
    this.userRoleId = roleId;
    this.userBidangId = bidangId;
    this.isAdmin = isAdmin;
  }

  can(permissionCode: string): boolean {
    if (this.isAdmin) return true;
    if (!this.userRoleId) return false;
    return this.rolePermissions.some(
      rp => rp.role_id === this.userRoleId &&
        this.matchPermissionCode(rp.permission_id, permissionCode)
    );
  }

  getScope(permissionCode: string): 'bidang' | 'all' | null {
    if (this.isAdmin) return 'all';
    const rp = this.rolePermissions.find(
      rp => rp.role_id === this.userRoleId &&
        this.matchPermissionCode(rp.permission_id, permissionCode)
    );
    return rp?.scope || null;
  }

  shouldFilterByBidang(permissionCode: string): boolean {
    return this.getScope(permissionCode) !== 'all';
  }

  private permissionCodeMap: Map<number, string> = new Map();
  setPermissionCodeMap(map: Map<number, string>) {
    this.permissionCodeMap = map;
  }

  private matchPermissionCode(permId: number, code: string): boolean {
    return this.permissionCodeMap.get(permId) === code;
  }
}

export const permissionChecker = new PermissionChecker();
