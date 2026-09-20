export type UserRole = 'visitor' | 'customer' | 'staff' | 'admin';

export type ApartmentStatus = 'Available' | 'Reserved' | 'Sold';

export type ApartmentType = 'Studio' | '1BR' | '2BR' | '3BR' | 'Penthouse';

export interface ApartmentImage {
  id: string;
  url: string;
  caption: string;
}

export interface Facility {
  id: string;
  name: string;
  icon: string;
}

export interface Apartment {
  id: string;
  title: string;
  buildingName: string;
  type: ApartmentType;
  status: ApartmentStatus;
  price: number;
  floor: number;
  size: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  city: string;
  district: string;
  description: string;
  yearBuilt: number;
  images: ApartmentImage[];
  floorPlanUrl: string;
  facilities: string[];
  latitude: number;
  longitude: number;
  featured: boolean;
  createdAt: string;
}

export type AppointmentStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Rescheduled'
  | 'Completed'
  | 'No-show'
  | 'Cancelled';

export interface Appointment {
  id: string;
  apartmentId: string;
  apartmentTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
}

export type ReservationStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Expired'
  | 'Cancelled';

export interface Reservation {
  id: string;
  apartmentId: string;
  apartmentTitle: string;
  customerName: string;
  customerEmail: string;
  reservationFee: number;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
}

export type PaymentType =
  | 'Reservation Fee'
  | 'Down Payment'
  | 'Installment'
  | 'Full Payment'
  | 'Installment Payment'
  | 'Part Payment';

export type PaymentStatus = 'Pending' | 'Verified' | 'Rejected';

export interface Payment {
  id: string;
  reservationId: string;
  apartmentTitle: string;
  customerName: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  proofUrl: string;
  receiptUrl: string;
  uploadedAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  notes: string;
  paymentPlanId?: string;
  paymentPlanItemId?: string;
}

export type PaymentPlanType =
  | 'Installment Plan'
  | 'Part Payment Plan';

export type PaymentPlanStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled';

export type PaymentPlanItemStatus =
  | 'Upcoming'
  | 'Pending Verification'
  | 'Paid';

export interface PaymentPlanItem {
  id: string;
  sequenceNo: number;
  amount: number;
  dueDate: string;
  status: PaymentPlanItemStatus;
}

export interface PaymentPlan {
  id: string;
  reservationId: string;
  apartmentId: string;
  apartmentTitle: string;

  customerName: string;
  customerEmail: string;

  planType: PaymentPlanType;

  numberOfPayments: number;
  paymentAmount: number;

  totalPlanAmount: number;
  remainingAmount: number;

  startDate?: string;

  status: PaymentPlanStatus;

  customerNotes?: string;
  adminNotes?: string;

  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;

  items?: PaymentPlanItem[];
}

export type InquiryCategory =
  | 'Pricing'
  | 'Availability'
  | 'Viewing'
  | 'Financing'
  | 'General';

export type InquiryPriority = 'Low' | 'Medium' | 'High';

export type InquiryStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface InquiryReply {
  id: string;
  author: string;
  authorRole: UserRole;
  message: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  apartmentId: string | null;
  apartmentTitle: string | null;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  category: InquiryCategory;
  priority: InquiryPriority;
  status: InquiryStatus;
  replies: InquiryReply[];
  createdAt: string;
}

export interface Review {
  id: string;
  apartmentId: string;
  apartmentTitle: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  status: 'Published' | 'Pending' | 'Hidden';
  createdAt: string;
}

export type NotificationType =
  | 'appointment'
  | 'reservation'
  | 'payment'
  | 'inquiry'
  | 'general';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Sale {
  id: string;
  apartmentId: string;
  apartmentTitle: string;
  customerName: string;
  customerEmail: string;
  finalPrice: number;
  reservationId: string;
  saleDate: string;
  staffName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl: string;
  createdAt: string;
  status: 'Active' | 'Inactive';
}

export interface DashboardKPI {
  label: string;
  value: string | number;
  change: number;
  icon: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DistrictStat {
  district: string;
  count: number;
  revenue: number;
}

export interface DashboardStats {
  totalApartments: number;
  availableApartments: number;
  activeReservations: number;
  soldApartments: number;
  pendingAppointments: number;
  pendingPayments: number;
  pendingAmount: number;
  unresolvedInquiries: number;
  totalCustomers: number;
  totalUsers: number;
  totalSalesCount: number;
  totalRevenue: number;
  realizedRevenue: number;
  monthRevenue: number;
  monthlySalesTrend?: ChartDataPoint[];
}

export interface ReportData {
  statusDistribution: ChartDataPoint[];
  monthlySales: ChartDataPoint[];
  monthlyRevenue: ChartDataPoint[];
  inquiryCategories: ChartDataPoint[];
  paymentTypes: ChartDataPoint[];
  districtStats: DistrictStat[];
  totalRevenue: number;
  avgSalePrice: number;
  totalPaidAmount: number;
  totalApartmentsListed: number;
}
