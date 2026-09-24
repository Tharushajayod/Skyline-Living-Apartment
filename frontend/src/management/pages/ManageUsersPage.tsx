import { useState, useEffect, useMemo } from 'react';
import { 
  Users as UsersIcon, Search, Shield, UserCog, Mail, Phone, 
  ShieldCheck, UserCheck, CheckCircle2, UserX, AlertTriangle, Sparkles 
} from 'lucide-react';
import type { User, UserRole } from '@/shared/types';
import { userService } from '@/shared/services/managementService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import EmptyState from '@/shared/components/ui/EmptyState';
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog';
import { Select, Input } from '@/shared/components/ui/Form';
import { initials, formatDate } from '@/shared/utils/format';

export default function ManageUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null);
  const [submittingRole, setSubmittingRole] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const counts = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role?.toLowerCase() === 'admin').length,
    staff: users.filter(u => u.role?.toLowerCase() === 'staff').length,
    customers: users.filter(u => u.role?.toLowerCase() === 'customer').length,
  }), [users]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.id && u.id.toLowerCase().includes(search.toLowerCase()));
      const matchesRole = !roleFilter || u.role?.toLowerCase() === roleFilter.toLowerCase();
      const matchesStatus = !statusFilter || u.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleRoleChange = async () => {
    if (!editTarget || !newRole) return;
    setSubmittingRole(true);
    try {
      const updated = await userService.updateRole(editTarget.id, newRole.toUpperCase() as UserRole);
      setUsers(prev => prev.map(u => u.id === editTarget.id ? updated : u));
      toast(`${editTarget.name}'s role updated to ${newRole.toUpperCase()}`, 'success');
      setEditTarget(null);
      setNewRole('');
    } catch (err: any) {
      toast(err.message || 'Failed to update user role', 'error');
    } finally {
      setSubmittingRole(false);
    }
  };

  const toggleStatus = async () => {
    if (!confirmTarget) return;
    const currentStatus = confirmTarget.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive';
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const updated = await userService.updateStatus(confirmTarget.id, newStatus);
      setUsers(prev => prev.map(u => u.id === confirmTarget.id ? updated : u));
      toast(`${confirmTarget.name} is now ${newStatus}`, 'success');
      setConfirmTarget(null);
    } catch (err: any) {
      toast(err.message || 'Failed to update user status', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-24">
        <EmptyState
          icon={<Shield className="w-12 h-12 text-slate-300" />}
          title="Administrator Access Required"
          description="This directory is restricted to System Administrators only. Please contact your supervisor."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 w-full">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Access & Security Management
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {counts.total} Registered Accounts
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Audit user roles, adjust administrative permissions, and deactivate inactive or suspended credentials.
          </p>
        </div>

        {/* Quick Role Stats Pill */}
        <div className="flex items-center gap-2 text-xs font-semibold bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-2xl shrink-0">
          <span className="text-amber-800 font-bold">{counts.admins} Admins</span>
          <span className="text-slate-300">•</span>
          <span className="text-blue-800 font-bold">{counts.staff} Staff</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-700 font-bold">{counts.customers} Clients</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by full name, email, or client ID..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-44">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              placeholder="All Roles"
              options={[
                { value: '', label: 'All Roles' },
                { value: 'admin', label: 'Administrator' },
                { value: 'staff', label: 'Staff Member' },
                { value: 'customer', label: 'Customer' },
              ]}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] overflow-hidden w-full">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            Loading user directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              variant="search"
              title="No users found"
              description="No user records match your selected search or role filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-5 py-3.5">User Profile & Contact</th>
                  <th className="px-5 py-3.5">System Role & Status</th>
                  <th className="px-5 py-3.5">Joined Date</th>
                  <th className="px-5 py-3.5 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const roleNormalized = u.role?.toLowerCase() || 'customer';
                  const isActive = u.status?.toLowerCase() === 'active';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* 1. User Profile & Contact */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-extrabold shrink-0 border shadow-2xs ${
                            roleNormalized === 'admin'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : roleNormalized === 'staff'
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            {initials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-900 text-sm truncate max-w-[200px]">{u.name}</span>
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {u.id || 'USR-000'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[220px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              {u.email}
                            </p>
                            {u.phone && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                {u.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. System Role & Status */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border inline-flex items-center gap-1 capitalize ${
                            roleNormalized === 'admin'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : roleNormalized === 'staff'
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {roleNormalized === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}
                            {roleNormalized}
                          </span>
                          <Badge variant={statusToVariant(u.status)} dot size="sm">
                            {u.status}
                          </Badge>
                        </div>
                      </td>

                      {/* 3. Joined Date */}
                      <td className="px-5 py-3.5 text-xs font-medium text-slate-500">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* 4. Access Controls */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditTarget(u);
                              setNewRole(roleNormalized);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-900 font-bold text-xs transition cursor-pointer"
                          >
                            <UserCog className="w-3.5 h-3.5 text-amber-600" />
                            <span>Role</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmTarget(u)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                              isActive
                                ? 'border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {isActive ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Role Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Update System User Role"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={submittingRole}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 shadow-md shadow-amber-500/20"
            >
              {submittingRole ? 'Updating...' : 'Save New Role'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center text-sm font-extrabold">
              {editTarget && initials(editTarget.name)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">{editTarget?.name}</p>
              <p className="text-xs text-slate-400 truncate">{editTarget?.email}</p>
            </div>
          </div>

          <Select
            label="Designated Access Level"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            options={[
              { value: 'customer', label: 'Customer (Client Access)' },
              { value: 'staff', label: 'Staff Member (Apartments, Bookings & Payments)' },
              { value: 'admin', label: 'Administrator (Full Access)' },
            ]}
          />
        </div>
      </Modal>

      {/* Deactivate / Activate Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={toggleStatus}
        title={confirmTarget?.status?.toLowerCase() === 'active' ? 'Deactivate User Account?' : 'Activate User Account?'}
        message={
          confirmTarget?.status?.toLowerCase() === 'active'
            ? `Are you sure you want to deactivate ${confirmTarget?.name}? They will be immediately prevented from logging into the portal.`
            : `Activate ${confirmTarget?.name}'s account and restore active system access?`
        }
        confirmLabel={confirmTarget?.status?.toLowerCase() === 'active' ? 'Deactivate Account' : 'Activate Account'}
        variant={confirmTarget?.status?.toLowerCase() === 'active' ? 'danger' : 'primary'}
      />

    </div>
  );
}