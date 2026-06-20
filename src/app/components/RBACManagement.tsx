import React, { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  Save,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import { notify } from '../../lib/notifications';

interface Role {
  id: number;
  name: string;
  level: number;
  is_system: boolean;
  user_count?: number;
}

interface PermissionItem {
  id: number;
  module: string;
  action: string;
  description_ar: string;
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  pos: 'نقاط البيع',
  products: 'المنتجات',
  inventory: 'المخزون',
  purchases: 'المشتريات',
  sales: 'المبيعات',
  users: 'المستخدمين',
  roles: 'الأدوار',
  reports: 'التقارير',
  settings: 'الإعدادات',
  general: 'عام',
};

export default function RBACManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [groupedPerms, setGroupedPerms] = useState<Record<string, PermissionItem[]>>({});
  const [rolePermIds, setRolePermIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  useEffect(() => {
    (async () => {
      try {
        const [rolesRes, groupedRes] = await Promise.all([
          apiClient.get('/accounts/roles/'),
          apiClient.get('/accounts/permissions/grouped/'),
        ]);
        const fetchedRoles: Role[] = rolesRes.data;
        setRoles(fetchedRoles);
        setGroupedPerms(groupedRes.data);
        if (fetchedRoles.length > 0) {
          setSelectedRoleId(fetchedRoles[0].id);
        }
      } catch (err: any) {
        notify.error('تعذّر تحميل بيانات الأدوار والصلاحيات');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;
    apiClient
      .get(`/accounts/roles/${selectedRoleId}/permissions/`)
      .then((res) => {
        setRolePermIds(new Set(res.data.map((p: PermissionItem) => p.id)));
      })
      .catch(() => notify.error('تعذّر تحميل صلاحيات الدور'));
  }, [selectedRoleId]);

  const togglePerm = (permId: number) => {
    if (selectedRole?.is_system && selectedRole.name === 'مدير') return;
    setRolePermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      await apiClient.post(`/accounts/roles/${selectedRoleId}/bulk_update_permissions/`, {
        permission_ids: Array.from(rolePermIds),
      });
      notify.success('تم حفظ الصلاحيات بنجاح');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'فشل تحديث الصلاحيات';
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-800">الأدوار والصلاحيات</h2>
      </div>

      {/* Roles list */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRoleId(role.id)}
            className={`flex flex-col items-start gap-1 rounded-lg px-4 py-2 text-sm font-medium transition min-w-[140px] ${
              selectedRoleId === role.id
                ? 'bg-blue-600 text-white'
                : 'bg-card text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{role.name}</span>
            </div>
            <span className={`text-xs mt-0.5 ${selectedRoleId === role.id ? 'text-blue-100' : 'text-gray-400'}`}>
              {role.user_count ?? 0} مستخدم
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              role.level === 0
                ? 'bg-red-500/10 text-red-700'
                : 'bg-muted text-muted-foreground'
            }`}>
              {role.level === 0 ? 'مدير كامل' : `مستوى ${role.level}`}
            </span>
          </button>
        ))}
      </div>

      {/* Permissions grid */}
      {selectedRole && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-600">
              دور: <span className="font-semibold text-slate-800">{selectedRole.name}</span>
              {selectedRole.is_system && (
                <span className="mr-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  نظامي
                </span>
              )}
            </p>
            <button
              onClick={handleSave}
              disabled={saving || (selectedRole.is_system && selectedRole.name === 'مدير')}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ
            </button>
          </div>

          {Object.entries(groupedPerms).map(([module, perms]) => (
            <div
              key={module}
              className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm"
            >
              <h3 className="mb-3 text-lg font-semibold text-slate-800">
                {MODULE_LABELS[module] || module}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {perms.map((perm) => {
                  const checked = rolePermIds.has(perm.id);
                  const disabled = selectedRole.is_system && selectedRole.name === 'مدير';
                  return (
                    <label
                      key={perm.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition ${
                        checked
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-slate-200 bg-card hover:bg-slate-50'
                      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => togglePerm(perm.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {perm.description_ar || `${perm.module}:${perm.action}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {perm.module}:{perm.action}
                        </p>
                      </div>
                      {checked ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-300" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

