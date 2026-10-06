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

export type RescheduleStatus = 'None' | 'Pending Customer' | 'Pending Admin';

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
  rescheduleStatus?: RescheduleStatus;
  proposedDate?: string;
  proposedTimeSlot?: string;
  rescheduleReason?: string;
  rescheduleRequestedBy?: string;
  rescheduleRequestedByRole?: string;
  rescheduleRequestedAt?: string;
  notes: string;
  createdAt: string;
}

export interface AppointmentRescheduleHistory {
  id: string;
  appointmentId: string;
  oldDate: string;
  oldTimeSlot: string;
  newDate: string;
  newTimeSlot: string;
  reason: string;
  changedBy: string;
  changedByRole: UserRole;
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
  appointmentId?: string;
  apartmentTitle: string;
  customerName: string;
  customerEmail: string;
  reservationFee: number;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
  hasPaymentCommitment?: boolean;
  paymentCommitmentReason?: string;
  hasCompletedSale?: boolean;
  saleId?: string;
  isFullyPaid?: boolean;
  totalPaid?: number;
  otherPaidAmount?: number;
  refundableAmount?: number;
  nonRefundableFee?: number;

  // Authoritative financial lifecycle fields
  reservationFeePaid?: boolean;
  verifiedPaid?: number;
  remainingBalance?: number;
  refundStatus?: string;
  refundAmount?: number;
  companyRetainedAmount?: number;
  refundProcessedAt?: string;
  customerConfirmedAt?: string;
  financiallyClosed?: boolean;
  canPayReservationFee?: boolean;
  canRequestSettlement?: boolean;
  canConfirmRefund?: boolean;
  settlementProgress?: number;
  displayStatus?: string;
  // Authoritative reservation timing fields
  reservationFeeConfirmedAt?: string | null;
  holdExpiresAt?: string | null;
  cancellationDeadline?: string | null;
  holdActive?: boolean;
  cancellationEligible?: boolean;
  remainingHoldSeconds?: number;
  remainingCancellationSeconds?: number;
}

export interface PurchasedApartment {
  saleId: string;
  apartmentId: string;
  apartmentNumber: string;
  title: string;
  buildingName?: string;
  address: string;
  city: string;
  district: string;
  type: string;
  floor: number | null;
  size: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  imageUrl: string;
  images: string[];
  purchasePrice: number;
  purchaseDate: string;
  status: string;
  ownershipStatus: string;
  ownershipDate?: string;
  reservationId?: string;
  staffName?: string;
}

export type RefundStatus =
  | 'Pending Review'
  | 'Awaiting Payment'
  | 'Pending'
  | 'Approved'
  | 'Processed'
  | 'Completed'
  | 'Payment Sent – Awaiting Confirmation'
  | 'PENDING_REVIEW'
  | 'PENDING_PAYMENT'
  | 'APPROVED'
  | 'PROCESSED'
  | 'SENT'
  | 'COMPLETED'
  | 'PENDING';
export type RefundType = 'Cancellation' | 'Expiration';

export interface ReservationRefund {
  id: string;
  reservationId: string;
  apartmentId: string;
  apartmentTitle: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  paymentId?: string;
  originalFee: number;
  refundAmount?: number | null;
  companyRetainedAmount?: number | null;
  refundStatus: RefundStatus;
  refundType: RefundType;
  reason: string;
  initiatedByRole?: string;
  initiatedByUserId?: string;
  initiatedByName?: string;
  requestedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  settlementNote?: string;
  refundMethod?: string;
  transactionReference?: string;
  proofUrl?: string;
  processedBy?: string;
  processedAt?: string;
  customerConfirmedAt?: string;
  customerConfirmedBy?: string;
  customerConfirmedUserId?: string | number;
  canCustomerConfirm?: boolean;
  notes?: string;
  createdAt: string;
  reservationStatus?: string;
  refundEligible?: boolean;
  refundRequestedAt?: string;
  message?: string;
}

export interface RefundEligibility {
  reservationId: string;
  eligible: boolean;
  cancellable: boolean;
  refundAmount: number;
  reservationFee: number;
  successfulPaymentTime?: string;
  refundDeadline?: string;
  remainingSeconds: number;
  refundStatus?: string;
  reason?: string;
}

export interface ReservationDetails {
  reservation: Reservation;
  customer: User | null;
  apartment: Apartment | null;
  appointment: Appointment | null;
  payment: Payment | null;
  allPayments: Payment[];
  refund: ReservationRefund | null;
  refundEligible?: boolean;
  refundDeadline?: string | null;
  refundAmount?: number;
  refundStatus?: string;
  remainingRefundSeconds?: number;
  successfulPaymentTime?: string | null;
  cancellationAllowed?: boolean;
  holdActive?: boolean;
  holdExpiresAt?: string | null;
  remainingHoldSeconds?: number;
  cancellationDeadline?: string | null;
  cancellationEligible?: boolean;
  remainingCancellationSeconds?: number;
  reservationFeeConfirmedAt?: string | null;
}

export type PaymentType =
  | 'Reservation Fee'
  | 'Installment'
  | 'Full Payment'
  | 'Installment Payment'
  | 'Part Payment'
  | 'RESERVATION_FEE'
  | 'FULL_PAYMENT'
  | 'INSTALLMENT'
  | 'PART_PAYMENT';

export type PaymentStatus = 'Pending' | 'Verified' | 'Rejected';

export interface Payment {
  id: string;
  reservationId: string;
  apartmentId?: string;
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
  | 'Plan Ready for Confirmation'
  | 'Terms Proposed'
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

  annualInterestRate?: number;
  interestAmount?: number;
  additionalAmount?: number;

  apartmentPrice?: number;
  reservationFee?: number;
  remainingPrincipal?: number;

  apartmentNumber?: string;
  buildingName?: string;
  reservationDate?: string;

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

export interface EligibleApartment {
  id: string;
  apartmentId?: string;
  numericId?: number;
  apartmentNumber?: string;
  unitNumber?: string;
  title: string;
  apartmentTitle?: string;
  buildingName?: string;
  type?: string;
  price?: number;
  floor?: number | null;
  size?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  imageUrl?: string;
  address?: string;
  city?: string;
  relationshipType: 'PURCHASED' | 'RESERVED';
  relationshipLabel: 'Purchased' | 'Reserved';
  hasReviewed: boolean;
  existingReviewId?: string;
  existingReviewStatus?: string;
  existingReviewRating?: number;
  existingReviewTitle?: string;
  existingReviewComment?: string;
}

export interface ReviewEligibility {
  eligible: boolean;
  reason?: string;
  relationshipType?: 'PURCHASED' | 'RESERVED' | 'STAFF' | null;
  relationshipLabel?: string | null;
  hasReviewed: boolean;
  existingReviewId?: string | null;
  existingReviewStatus?: string | null;
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

export interface PaymentSummary {
  apartmentPrice: number;
  totalVerifiedPayments: number;
  remainingBalance: number;
  paymentCount: number;
}

export interface SaleDetails {
  sale: Sale;
  customer: User | null;
  apartment: Apartment | null;
  reservation: Reservation | null;
  paymentSummary: PaymentSummary;
  payments: Payment[];
  paymentPlan: PaymentPlan | null;
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

export interface MonthlyCashflowPoint {
  label: string;
  yearMonth: string;
  grossInflow: number;
  refundOutflow: number;
  netCashflow: number;
  contractSales: number;
  salesCount: number;
}

export interface SalesSummary {
  totalSalesCount: number;
  totalSalesRevenue: number;
  averageSalePrice: number;
  thisMonthSalesCount: number;
  thisMonthSalesRevenue: number;
  totalRetainedFeeIncome: number;
  totalCustomerRefunds: number;
  pendingReviewRefundsCount: number;
  awaitingPaymentRefundsCount: number;
  completedRefundsCount: number;
  totalRefundRecordsCount: number;
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
  totalSalesValue?: number;
  totalRevenue: number;
  grossVerifiedInflow?: number;
  completedRefundOutflow?: number;
  netRealizedCash?: number;
  realizedRevenue: number;
  retainedFeeIncome?: number;
  monthGrossInflow?: number;
  monthRefundOutflow?: number;
  monthNetCashflow?: number;
  monthRevenue: number;
  monthlySalesTrend?: ChartDataPoint[];
  monthlyCashflow?: MonthlyCashflowPoint[];
}

export interface ReportData {
  statusDistribution: ChartDataPoint[];
  monthlySales: ChartDataPoint[];
  monthlyRevenue: ChartDataPoint[];
  monthlyCashflow?: MonthlyCashflowPoint[];
  inquiryCategories: ChartDataPoint[];
  paymentTypes: ChartDataPoint[];
  districtStats: DistrictStat[];
  grossVerifiedInflow?: number;
  completedRefundOutflow?: number;
  netRealizedCash?: number;
  totalContractSales?: number;
  totalRevenue: number;
  apartmentsSold?: number;
  avgSalePrice: number;
  retainedFeeIncome?: number;
  totalPaidAmount: number;
  totalApartmentsListed: number;
}

