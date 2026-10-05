import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Pencil, Trash2, Building2, Star, MapPin,
  Upload, X, Loader2, FileText, Image as ImageIcon
} from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Badge, { statusToVariant } from '@/shared/components/ui/Badge';
import Modal from '@/shared/components/ui/Modal';
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog';
import EmptyState from '@/shared/components/ui/EmptyState';
import { Input, Select, Textarea } from '@/shared/components/ui/Form';
import { useToast } from '@/shared/components/ui/Toast';
import { useAuth } from '@/shared/contexts/AuthContext';
import { apartmentService } from '@/shared/services/apartmentService';
import { allFacilitiesList } from '@/shared/mockData';
import { formatCurrency } from '@/shared/utils/format';
import type { Apartment, ApartmentStatus, ApartmentType } from '@/shared/types';

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'Available', label: 'Available' },
  { value: 'Reserved', label: 'Reserved' },
  { value: 'Sold', label: 'Sold' },
];
const typeOptions: { value: string; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'Studio', label: 'Studio' },
  { value: '1BR', label: '1 Bedroom' },
  { value: '2BR', label: '2 Bedroom' },
  { value: '3BR', label: '3 Bedroom' },
  { value: 'Penthouse', label: 'Penthouse' },
];
const formTypeOptions = typeOptions.slice(1);

interface FormState {
  title: string; buildingName: string; type: ApartmentType;
  price: string; floor: string; size: string; bedrooms: string; bathrooms: string;
  address: string; city: string; district: string; description: string; yearBuilt: string;
  facilities: string[]; featured: boolean; images: string[]; floorPlanUrl: string;
}

const emptyForm: FormState = {
  title: '', buildingName: '', type: '2BR',
  price: '', floor: '', size: '', bedrooms: '', bathrooms: '',
  address: '', city: 'Colombo', district: '', description: '', yearBuilt: String(new Date().getFullYear()),
  facilities: [], featured: false, images: [], floorPlanUrl: '',
};

export default function ManageApartmentsPage() {
  const { user } = useAuth();
  const isAdmin = (user?.role as string)?.toLowerCase() === 'admin';
  const { toast } = useToast();

  const cached = apartmentService.getCachedAll();
  const [list, setList] = useState<Apartment[]>(() => (Array.isArray(cached) ? cached : []));
  const [loading, setLoading] = useState(!cached || cached.length === 0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Apartment | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingFloorPlan, setUploadingFloorPlan] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Apartment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const floorPlanInputRef = useRef<HTMLInputElement>(null);

  const fetchApartments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await apartmentService.getAll({ includeSold: true });
      setList(data);
    } catch (err: any) {
      console.error(err);
      toast('Failed to load apartments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments(!cached || cached.length === 0);
  }, []);

  const filtered = useMemo(() => {
    return list.filter(a => {
      const matchesSearch = !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.district.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || a.status === statusFilter;
      const matchesType = !typeFilter || a.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [list, search, statusFilter, typeFilter]);

  const currentYear = new Date().getFullYear();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const yearBuiltOptions = useMemo(() => {
    const years: { value: string; label: string }[] = [];
    for (let y = currentYear; y >= 1980; y--) {
      years.push({ value: String(y), label: String(y) });
    }
    if (form.yearBuilt && !years.some(o => o.value === form.yearBuilt)) {
      years.unshift({ value: form.yearBuilt, label: form.yearBuilt });
    }
    return years;
  }, [currentYear, form.yearBuilt]);

  function validateSingleField(field: keyof FormState, value: any): string {
    switch (field) {
      case 'title':
        if (!value || !String(value).trim()) return 'Title is required';
        return '';
      case 'district':
        if (!value || !String(value).trim()) return 'District is required';
        return '';
      case 'price': {
        if (value === '' || value === null || value === undefined) return 'Price is required';
        const num = Number(value);
        if (isNaN(num) || num <= 0) return 'Price must be greater than Rs. 0.';
        return '';
      }
      case 'floor': {
        if (value === '' || value === null || value === undefined) return 'Floor is required';
        const num = Number(value);
        if (isNaN(num) || num < 0) return 'Floor cannot be negative.';
        if (!Number.isInteger(num)) return 'Floor must be a whole integer.';
        return '';
      }
      case 'size': {
        if (value === '' || value === null || value === undefined) return 'Size is required';
        const num = Number(value);
        if (isNaN(num) || num <= 0) return 'Size must be greater than 0 sqm.';
        return '';
      }
      case 'bedrooms': {
        if (value === '' || value === null || value === undefined) return 'Bedrooms is required';
        const num = Number(value);
        if (isNaN(num) || num < 1) return 'Bedrooms must be at least 1.';
        if (!Number.isInteger(num)) return 'Bedrooms must be a whole integer.';
        return '';
      }
      case 'bathrooms': {
        if (value === '' || value === null || value === undefined) return 'Bathrooms is required';
        const num = Number(value);
        if (isNaN(num) || num < 1) return 'Bathrooms must be at least 1.';
        if (!Number.isInteger(num)) return 'Bathrooms must be a whole integer.';
        return '';
      }
      case 'yearBuilt': {
        if (!value) return 'Year built is required';
        const num = Number(value);
        if (isNaN(num) || num < 1980) return 'Year built must be 1980 or later.';
        if (num > currentYear) return 'Year built cannot be in the future.';
        return '';
      }
      default:
        return '';
    }
  }

  function openAdd() {
    setEditing(null);
    setErrors({});
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(apt: Apartment) {
    if (apt.status?.toUpperCase() === 'SOLD') {
      toast('Sold apartments cannot be edited because they are part of completed sales records.', 'warning');
      return;
    }
    setEditing(apt);
    setErrors({});
    setForm({
      title: apt.title, buildingName: apt.buildingName, type: apt.type,
      price: String(apt.price), floor: String(apt.floor), size: String(apt.size),
      bedrooms: String(apt.bedrooms), bathrooms: String(apt.bathrooms),
      address: apt.address, city: apt.city, district: apt.district, description: apt.description,
      yearBuilt: String(apt.yearBuilt || currentYear), facilities: apt.facilities || [], featured: apt.featured,
      images: apt.images?.map(i => i.url) || [],
      floorPlanUrl: apt.floorPlanUrl || '',
    });
    setModalOpen(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      const fieldError = validateSingleField(key, value);
      setErrors(prev => {
        const next = { ...prev };
        if (fieldError) {
          next[key] = fieldError;
        } else {
          delete next[key];
        }
        return next;
      });
    }
  }

  function toggleFacility(name: string) {
    setForm(prev => ({
      ...prev,
      facilities: prev.facilities.includes(name)
        ? prev.facilities.filter(f => f !== name)
        : [...prev.facilities, name],
    }));
  }

  const uploadFileToCloudinary = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (cloudName && uploadPreset) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: fd,
      });

      if (res.ok) {
        const data = await res.json();
        return data.secure_url;
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadFileToCloudinary(file));
      const uploadedUrls = await Promise.all(uploadPromises);

      setForm(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      toast(`${uploadedUrls.length} photo(s) uploaded successfully`, 'success');
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to upload images', 'error');
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFloorPlanSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFloorPlan(true);
    try {
      const uploadedUrl = await uploadFileToCloudinary(file);
      setForm(prev => ({ ...prev, floorPlanUrl: uploadedUrl }));
      toast('Floor plan diagram uploaded successfully', 'success');
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to upload floor plan', 'error');
    } finally {
      setUploadingFloorPlan(false);
      if (floorPlanInputRef.current) floorPlanInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  async function handleSave() {
    const fieldsToValidate: (keyof FormState)[] = [
      'title', 'district', 'price', 'floor', 'size', 'bedrooms', 'bathrooms', 'yearBuilt'
    ];
    const newErrors: Record<string, string> = {};
    for (const f of fieldsToValidate) {
      const err = validateSingleField(f, form[f]);
      if (err) newErrors[f] = err;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstInvalid = fieldsToValidate.find(f => newErrors[f]);
      if (firstInvalid) {
        setTimeout(() => {
          const el = document.getElementById(`apt-field-${firstInvalid}`);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
      }
      return;
    }

    const images = form.images.map((url, i) => ({ id: `img-${i + 1}`, url, caption: `Image ${i + 1}` }));
    const base = {
      title: form.title.trim(),
      buildingName: form.buildingName.trim(),
      type: form.type,
      price: Number(form.price),
      floor: Number(form.floor),
      size: Number(form.size),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      address: form.address.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      description: form.description.trim(),
      yearBuilt: Number(form.yearBuilt),
      facilities: form.facilities,
      featured: form.featured,
      floorPlanUrl: form.floorPlanUrl,
      latitude: 1.3,
      longitude: 103.8,
    };
    try {
      if (editing) {
        const updated = await apartmentService.update(editing.id, { ...base, images: images.length ? images : editing.images });
        setList(prev => prev.map(a => a.id === editing.id ? updated : a));
        toast('Apartment updated successfully', 'success');
      } else {
        const created = await apartmentService.create({ ...base, images, status: 'Available' });
        setList(prev => [created, ...prev]);
        toast('Apartment created successfully', 'success');
      }
      setModalOpen(false);
    } catch (err: any) {
      if (err.validationErrors && typeof err.validationErrors === 'object' && Object.keys(err.validationErrors).length > 0) {
        setErrors(err.validationErrors);
        const firstKey = Object.keys(err.validationErrors)[0];
        setTimeout(() => {
          const el = document.getElementById(`apt-field-${firstKey}`);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
      } else {
        toast(err.message || 'Failed to save apartment', 'error');
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.status?.toUpperCase() === 'SOLD') {
      toast('Sold apartments cannot be deleted because they are part of completed sales records.', 'error');
      setDeleteTarget(null);
      return;
    }
    try {
      await apartmentService.delete(deleteTarget.id);
      setList(prev => prev.filter(a => a.id !== deleteTarget.id));
      toast('Apartment deleted successfully', 'success');
      setDeleteTarget(null);
    } catch (err: any) {
      toast(err.message || 'Failed to delete apartment', 'error');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(15,23,42,0.03)] p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              SKYLINE APARTMENT MANAGEMENT SYSTEM
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Apartments
          </h1>
          <p className="text-navy-400 mt-1">{filtered.length} of {list.length} properties</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Apartment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input placeholder="Search by title or district..." icon={<Search className="w-4 h-4" />} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="sm:w-48">
          <Select options={statusOptions} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />
        </div>
        <div className="sm:w-48">
          <Select options={typeOptions} value={typeFilter} onChange={e => setTypeFilter(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-slate-100">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading properties...</div>
        ) : filtered.length === 0 ? (
          <EmptyState variant="search" title="No apartments found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-5 py-3.5">Apartment & Residence</th>
                  <th className="px-5 py-3.5">Layout & Floor</th>
                  <th className="px-5 py-3.5">Pricing & Valuation</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(apt => {
                  const isSold = apt.status?.toUpperCase() === 'SOLD';
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* 1. Apartment & Residence */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={apt.images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80'}
                            alt={apt.title}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200/80 shadow-xs"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-900 leading-tight truncate max-w-[220px]">
                                {apt.title}
                              </span>
                              {apt.featured && (
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {apt.buildingName} • <span className="text-slate-400">{apt.district || apt.city}</span>
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                              <span>{apt.bedrooms} Beds</span>
                              <span>•</span>
                              <span>{apt.bathrooms} Baths</span>
                              {apt.size && (
                                <>
                                  <span>•</span>
                                  <span>{apt.size} sq.ft</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Layout & Floor */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                          {apt.type}
                        </span>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          Floor {apt.floor || 'N/A'}
                        </p>
                      </td>

                      {/* 3. Pricing & Valuation */}
                      <td className="px-5 py-3.5">
                        <p className="font-extrabold text-slate-900 text-sm">
                          {formatCurrency(apt.price)}
                        </p>
                        {apt.size && apt.price ? (
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                            {formatCurrency(Math.round(apt.price / Number(apt.size)))} / sq.ft
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 mt-0.5">Built {apt.yearBuilt || '2024'}</p>
                        )}
                      </td>

                      {/* 4. Status */}
                      <td className="px-5 py-3.5">
                        <Badge variant={statusToVariant(apt.status)} size="sm" dot>
                          {apt.status}
                        </Badge>
                      </td>

                      {/* 5. Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isSold ? (
                            <div className="flex items-center gap-1 text-slate-400">
                              <button
                                disabled
                                className="p-2 text-slate-300 cursor-not-allowed rounded-lg opacity-40"
                                title="Sold apartments cannot be edited."
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <button
                                  disabled
                                  className="p-2 text-slate-300 cursor-not-allowed rounded-lg opacity-40"
                                  title="Sold apartments cannot be deleted."
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => openEdit(apt)}
                                className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-amber-200"
                                title="Edit Apartment"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => setDeleteTarget(apt)}
                                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                                  title="Delete Apartment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
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

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Apartment' : 'Add New Apartment'}
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={uploadingImages || uploadingFloorPlan}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {(uploadingImages || uploadingFloorPlan) && <Loader2 className="w-4 h-4 animate-spin text-slate-950" />}
              <span>{editing ? 'Save Changes' : 'Create Apartment'}</span>
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              id="apt-field-title"
              label="Title"
              value={form.title}
              error={errors.title}
              onChange={e => setField('title', e.target.value)}
            />
          </div>
          <Input
            id="apt-field-buildingName"
            label="Building Name"
            value={form.buildingName}
            onChange={e => setField('buildingName', e.target.value)}
          />
          <Select
            id="apt-field-type"
            label="Apartment Type"
            options={formTypeOptions}
            value={form.type}
            onChange={e => setField('type', e.target.value as ApartmentType)}
          />
          <Input
            id="apt-field-price"
            label="Price (Rs.)"
            type="number"
            value={form.price}
            error={errors.price}
            onChange={e => setField('price', e.target.value)}
          />
          <Input
            id="apt-field-floor"
            label="Floor"
            type="number"
            value={form.floor}
            error={errors.floor}
            onChange={e => setField('floor', e.target.value)}
          />
          <Input
            id="apt-field-size"
            label="Size (sqm)"
            type="number"
            value={form.size}
            error={errors.size}
            onChange={e => setField('size', e.target.value)}
          />
          <Input
            id="apt-field-bedrooms"
            label="Bedrooms"
            type="number"
            value={form.bedrooms}
            error={errors.bedrooms}
            onChange={e => setField('bedrooms', e.target.value)}
          />
          <Input
            id="apt-field-bathrooms"
            label="Bathrooms"
            type="number"
            value={form.bathrooms}
            error={errors.bathrooms}
            onChange={e => setField('bathrooms', e.target.value)}
          />
          <Select
            id="apt-field-yearBuilt"
            label="Year Built"
            options={yearBuiltOptions}
            value={form.yearBuilt}
            error={errors.yearBuilt}
            onChange={e => setField('yearBuilt', e.target.value)}
          />
          <div className="sm:col-span-2">
            <Input
              id="apt-field-address"
              label="Address"
              value={form.address}
              onChange={e => setField('address', e.target.value)}
              icon={<MapPin className="w-4 h-4" />}
            />
          </div>
          <Input
            id="apt-field-city"
            label="City"
            value={form.city}
            onChange={e => setField('city', e.target.value)}
          />
          <Input
            id="apt-field-district"
            label="District"
            value={form.district}
            error={errors.district}
            onChange={e => setField('district', e.target.value)}
          />
          <div className="sm:col-span-2">
            <Textarea
              id="apt-field-description"
              label="Description"
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Apartment Gallery Photos */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-navy-700 mb-2">Apartment Photos</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFilesSelected}
              accept="image/*"
              multiple
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/60 hover:bg-amber-50/20 rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
            >
              {uploadingImages ? (
                <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading photos...</span>
                </div>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Click to upload photos</p>
                  <p className="text-xs text-slate-400">PNG, JPG or WEBP up to 5MB (multiple)</p>
                </>
              )}
            </div>

            {form.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {form.images.map((imgUrl, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 h-20 bg-slate-100">
                    <img src={imgUrl} alt={`Uploaded ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-slate-900/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Architectural Floor Plan Upload Section */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-navy-700 mb-2">Architectural Floor Plan Diagram</label>
            <input
              type="file"
              ref={floorPlanInputRef}
              onChange={handleFloorPlanSelected}
              accept="image/*"
              className="hidden"
            />

            {form.floorPlanUrl ? (
              <div className="relative rounded-2xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={form.floorPlanUrl} alt="Floor Plan" className="w-16 h-16 rounded-xl object-contain bg-white border border-slate-200 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">Architectural Floor Plan Attached</p>
                    <button
                      type="button"
                      onClick={() => floorPlanInputRef.current?.click()}
                      className="text-xs text-amber-600 hover:text-amber-700 font-semibold underline mt-0.5"
                    >
                      Change Diagram
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setField('floorPlanUrl', '')}
                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition text-slate-600"
                  title="Remove floor plan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => floorPlanInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/60 hover:bg-amber-50/20 rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
              >
                {uploadingFloorPlan ? (
                  <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading floor plan...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">Upload 2D / 3D Floor Plan Layout</p>
                    <p className="text-xs text-slate-400">Architectural blueprint or blueprint rendering</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-navy-700 mb-2">Facilities</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-thin p-1">
              {allFacilitiesList.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFacility(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.facilities.includes(f)
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm'
                    : 'bg-white text-navy-600 border-navy-200 hover:border-amber-400'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => setField('featured', e.target.checked)}
                className="w-4 h-4 rounded border-navy-300 text-amber-500 focus:ring-amber-400" />
              <span className="text-sm text-navy-700 flex items-center gap-1 font-medium">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Featured listing
              </span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Apartment"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}