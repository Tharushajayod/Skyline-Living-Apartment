import { useState, useRef } from 'react';
import { User, Mail, Phone, Lock, Save, Camera, Shield, Calendar, BadgeCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import Button from '@/shared/components/ui/Button';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Form';
import { formatDate } from '@/shared/utils/format';
import type { UserRole } from '@/shared/types';
import { apiClient } from '@/shared/services/api';

const ROLE_LABELS: Record<string, string> = {
  visitor: 'Visitor',
  customer: 'Customer',
  staff: 'Staff',
  admin: 'Administrator',
  ADMIN: 'Administrator',
  STAFF: 'Staff',
  CUSTOMER: 'Customer',
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth() as any;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    avatarUrl: user?.avatarUrl || user?.avatar_url || '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Password section
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Cloudinary upload helper with direct Base64 fallback
  const processImageUpload = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // Cloudinary keys .env eke hariyata thiyenawanam Cloudinary ekata upload karanawa
    if (cloudName && uploadPreset) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return data.secure_url;
      }
    }

    // Cloudinary setup karala nathnam direct Base64 string ekak vidiyata DB ekata yawanawa
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Image Selection Handler
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast('Image size should be less than 2MB', 'error');
      return;
    }

    setUploadingImg(true);
    try {
      const imageResultUrl = await processImageUpload(file);
      setForm((prev) => ({ ...prev, avatarUrl: imageResultUrl }));

      // Backend: PUT /api/users/profile
      const updatedUser = await apiClient.put<any>('/users/profile', {
        name: form.name,
        phone: form.phone,
        avatarUrl: imageResultUrl,
      });

      if (updateUser) {
        updateUser(updatedUser || { ...user, avatarUrl: imageResultUrl, avatar_url: imageResultUrl });
      }
      toast('Profile photo updated and saved to database!', 'success');
    } catch (err: any) {
      console.error('Image upload failed:', err);
      toast(err.message || 'Failed to update profile picture', 'error');
    } finally {
      setUploadingImg(false);
    }
  };

  // Profile Details Save (PUT /api/users/profile)
  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      toast('Name cannot be empty', 'error');
      return;
    }

    setSaving(true);
    try {
      // Backend UserController eke @PutMapping("/profile") endpoint ekata direct call eka
      const updatedUser = await apiClient.put<any>('/users/profile', {
        name: form.name,
        phone: form.phone,
        avatarUrl: form.avatarUrl,
      });

      if (updateUser) {
        updateUser(updatedUser || {
          ...user,
          name: form.name,
          phone: form.phone,
          avatarUrl: form.avatarUrl,
          avatar_url: form.avatarUrl,
        });
      }

      toast('Profile details updated successfully!', 'success');
    } catch (err: any) {
      console.error('Profile update error:', err);
      toast(err.message || 'Failed to update profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Password Change (PUT /api/users/change-password)
  const handleChangePassword = async () => {
    const e: Record<string, string> = {};
    if (!passwordForm.current) e.current = 'Current password is required';
    if (!passwordForm.next) e.next = 'New password is required';
    else if (passwordForm.next.length < 6) e.next = 'Password must be at least 6 characters';
    if (passwordForm.next !== passwordForm.confirm) e.confirm = 'Passwords do not match';
    setPasswordErrors(e);
    if (Object.keys(e).length > 0) return;

    setSavingPassword(true);
    try {
      // Backend: @PutMapping("/change-password")
      await apiClient.put('/users/change-password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
        confirmPassword: passwordForm.confirm,
      });

      setPasswordForm({ current: '', next: '', confirm: '' });
      toast('Password changed successfully!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to change password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20">

      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            Account Management
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            My Profile
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your personal profile details, contact preferences, and security.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Account Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.04)] p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

            {/* Avatar Profile Picture */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-extrabold text-2xl shadow-md shadow-amber-500/20 border-2 border-white">
                {uploadingImg ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
                ) : form.avatarUrl ? (
                  <img src={form.avatarUrl} alt={form.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(form.name)
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white rounded-full border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-amber-600 hover:scale-110 transition"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{form.name}</h2>
              <p className="text-sm text-slate-500 font-medium truncate mt-0.5">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant={statusToVariant(user.status)} dot>{user.status}</Badge>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="text-left sm:text-right">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1 justify-start sm:justify-end">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  Member Since
                </div>
                <p className="text-sm font-bold text-slate-900">{formatDate(user.createdAt)}</p>
              </div>

            </div>

          </div>
        </div>

        {/* 2-Column Forms Layout */}
        <div className="grid lg:grid-cols-2 gap-8">

          {/* Edit Profile Form */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.04)] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Personal Information</h3>
                  <p className="text-xs text-slate-500">Update your account name and contact number</p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  name="name"
                  icon={<User className="w-4 h-4 text-slate-400" />}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  icon={<Mail className="w-4 h-4 text-slate-400" />}
                  value={form.email}
                  disabled
                  className="bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200"
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="07xxxxxxxx"
                  icon={<Phone className="w-4 h-4 text-slate-400" />}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Button
                variant="primary"
                loading={saving}
                icon={!saving ? <Save className="w-4 h-4" /> : undefined}
                onClick={handleSaveProfile}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 py-3 shadow-md shadow-amber-500/10"
              >
                Save Changes to Database
              </Button>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.04)] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Security & Password</h3>
                  <p className="text-xs text-slate-500">Update your access credentials</p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4 text-slate-400" />}
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
                  error={passwordErrors.current}
                />
                <Input
                  label="New Password"
                  name="newPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  icon={<Lock className="w-4 h-4 text-slate-400" />}
                  value={passwordForm.next}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                  error={passwordErrors.next}
                />
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  icon={<Lock className="w-4 h-4 text-slate-400" />}
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                  error={passwordErrors.confirm}
                />
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 space-y-2">
              <Button
                variant="outline"
                loading={savingPassword}
                onClick={handleChangePassword}
                className="w-full border-amber-400 text-slate-900 hover:bg-amber-50 font-bold py-3"
              >
                Update Password
              </Button>
              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Passwords are encrypted.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}