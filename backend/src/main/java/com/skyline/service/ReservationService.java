package com.skyline.service;

import com.skyline.dto.apartment.ApartmentResponse;
import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.reservation.*;
import com.skyline.dto.user.UserDto;
import com.skyline.entity.*;
import com.skyline.enums.*;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ConflictException;
import com.skyline.exception.ForbiddenException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.factory.reservation.*;
import com.skyline.observer.NotificationEvent;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.AppointmentRepository;
import com.skyline.repository.PaymentPlanRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.ReservationRefundRepository;
import com.skyline.repository.ReservationRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.util.IdParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ApartmentRepository apartmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentPlanRepository paymentPlanRepository;
    private final ReservationRefundRepository reservationRefundRepository;
    private final SaleRepository saleRepository;
    private final UserService userService;
    private final NotificationSubject notificationSubject;
    private Clock clock = Clock.systemDefaultZone();

    public void setClock(Clock clock) {
        this.clock = clock;
    }

    public LocalDateTime getCurrentDateTime() {
        return LocalDateTime.now(this.clock);
    }

    private final ReservationRefundFactory reservationRefundFactory;
    private final ApartmentAvailabilityService availabilityService;

    public ReservationService(ReservationRepository reservationRepository,
                              ApartmentRepository apartmentRepository,
                              AppointmentRepository appointmentRepository,
                              PaymentRepository paymentRepository,
                              PaymentPlanRepository paymentPlanRepository,
                              ReservationRefundRepository reservationRefundRepository,
                              SaleRepository saleRepository,
                              UserService userService,
                              NotificationSubject notificationSubject) {
        this(reservationRepository, apartmentRepository, appointmentRepository, paymentRepository, paymentPlanRepository,
                reservationRefundRepository, saleRepository, userService, notificationSubject,
                new com.skyline.factory.reservation.ReservationRefundFactoryImpl(),
                new ApartmentAvailabilityService(apartmentRepository, reservationRepository, saleRepository));
    }

    public ReservationService(ReservationRepository reservationRepository,
                              ApartmentRepository apartmentRepository,
                              AppointmentRepository appointmentRepository,
                              PaymentRepository paymentRepository,
                              PaymentPlanRepository paymentPlanRepository,
                              ReservationRefundRepository reservationRefundRepository,
                              SaleRepository saleRepository,
                              UserService userService,
                              NotificationSubject notificationSubject,
                              com.skyline.factory.reservation.ReservationRefundFactory reservationRefundFactory) {
        this(reservationRepository, apartmentRepository, appointmentRepository, paymentRepository, paymentPlanRepository,
                reservationRefundRepository, saleRepository, userService, notificationSubject,
                reservationRefundFactory,
                new ApartmentAvailabilityService(apartmentRepository, reservationRepository, saleRepository));
    }

    @Autowired
    public ReservationService(ReservationRepository reservationRepository,
                              ApartmentRepository apartmentRepository,
                              AppointmentRepository appointmentRepository,
                              PaymentRepository paymentRepository,
                              PaymentPlanRepository paymentPlanRepository,
                              ReservationRefundRepository reservationRefundRepository,
                              SaleRepository saleRepository,
                              UserService userService,
                              NotificationSubject notificationSubject,
                              com.skyline.factory.reservation.ReservationRefundFactory reservationRefundFactory,
                              ApartmentAvailabilityService availabilityService) {
        this.reservationRepository = reservationRepository;
        this.apartmentRepository = apartmentRepository;
        this.appointmentRepository = appointmentRepository;
        this.paymentRepository = paymentRepository;
        this.paymentPlanRepository = paymentPlanRepository;
        this.reservationRefundRepository = reservationRefundRepository;
        this.saleRepository = saleRepository;
        this.userService = userService;
        this.notificationSubject = notificationSubject;
        this.reservationRefundFactory = reservationRefundFactory;
        this.availabilityService = availabilityService;
    }

    public boolean hasFinancialCommitment(Reservation reservation) {
        if (reservation == null) return false;
        if (reservation.getId() != null) {
            boolean hasPlan = paymentPlanRepository.existsByReservationIdAndStatusIn(
                    reservation.getId(),
                    List.of(PaymentPlanStatus.APPROVED, PaymentPlanStatus.PENDING, PaymentPlanStatus.COMPLETED)
            );
            if (hasPlan) return true;
        }

        List<PaymentPlan> plans = new ArrayList<>();
        if (reservation.getId() != null) {
            plans.addAll(paymentPlanRepository.findByReservationIdOrderByCreatedAtDesc(reservation.getId()));
        }

        List<Payment> payments = new ArrayList<>();
        if (reservation.getId() != null) {
            payments.addAll(paymentRepository.findByReservationId(reservation.getId()));
        }

        return hasFinancialCommitment(reservation, plans, payments);
    }

    public boolean hasFinancialCommitment(Reservation reservation,
                                          List<PaymentPlan> relatedPlans,
                                          List<Payment> relatedPayments) {
        if (reservation == null) return false;

        if (relatedPlans != null) {
            boolean hasPlan = relatedPlans.stream().anyMatch(p ->
                    p.getStatus() == PaymentPlanStatus.APPROVED ||
                    p.getStatus() == PaymentPlanStatus.PENDING ||
                    p.getStatus() == PaymentPlanStatus.COMPLETED
            );
            if (hasPlan) return true;
        }

        if (relatedPayments != null) {
            for (Payment p : relatedPayments) {
                if (p.getStatus() == PaymentStatus.VERIFIED || p.getStatus() == PaymentStatus.PENDING) {
                    if (p.getType() == PaymentType.FULL_PAYMENT ||
                        p.getType() == PaymentType.PART_PAYMENT ||
                        p.getType() == PaymentType.INSTALLMENT ||
                        p.getType() == PaymentType.INSTALLMENT_PAYMENT) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public String getFinancialCommitmentReason(Reservation reservation) {
        if (reservation == null) return null;
        List<PaymentPlan> plans = new ArrayList<>();
        if (reservation.getId() != null) {
            plans.addAll(paymentPlanRepository.findByReservationIdOrderByCreatedAtDesc(reservation.getId()));
        }

        List<Payment> payments = new ArrayList<>();
        if (reservation.getId() != null) {
            payments.addAll(paymentRepository.findByReservationId(reservation.getId()));
        }

        return getFinancialCommitmentReason(reservation, plans, payments);
    }

    public String getFinancialCommitmentReason(Reservation reservation,
                                              List<PaymentPlan> relatedPlans,
                                              List<Payment> relatedPayments) {
        if (reservation == null) return null;

        List<Payment> payments = relatedPayments != null ? relatedPayments : List.of();
        List<PaymentPlan> plans = relatedPlans != null ? relatedPlans : List.of();

        // 1. Check for verified full payment
        boolean hasFullPayment = payments.stream().anyMatch(p ->
                p.getStatus() == PaymentStatus.VERIFIED && p.getType() == PaymentType.FULL_PAYMENT
        );
        if (hasFullPayment) {
            return "Full Payment Verified";
        }

        // 2. Check for active payment plan
        boolean hasActivePlan = plans.stream().anyMatch(p ->
                p.getStatus() == PaymentPlanStatus.APPROVED || p.getStatus() == PaymentPlanStatus.COMPLETED
        );
        if (hasActivePlan) {
            return "Active Installment Plan";
        }

        // 3. Check for verified part payment
        boolean hasPartPayment = payments.stream().anyMatch(p ->
                p.getStatus() == PaymentStatus.VERIFIED && p.getType() == PaymentType.PART_PAYMENT
        );
        if (hasPartPayment) {
            return "Part Payment Made";
        }

        // 4. Check for verified installment payment
        boolean hasInstallmentPayment = payments.stream().anyMatch(p ->
                p.getStatus() == PaymentStatus.VERIFIED && (p.getType() == PaymentType.INSTALLMENT || p.getType() == PaymentType.INSTALLMENT_PAYMENT)
        );
        if (hasInstallmentPayment) {
            return "Installment Payment Verified";
        }

        // 5. Check for pending payment plan / pending major payment
        boolean hasPendingPlan = plans.stream().anyMatch(p -> p.getStatus() == PaymentPlanStatus.PENDING);
        if (hasPendingPlan) {
            return "Payment Plan Review Pending";
        }

        boolean hasPendingMajorPayment = payments.stream().anyMatch(p ->
                p.getStatus() == PaymentStatus.PENDING && (
                        p.getType() == PaymentType.FULL_PAYMENT ||
                        p.getType() == PaymentType.PART_PAYMENT ||
                        p.getType() == PaymentType.INSTALLMENT ||
                        p.getType() == PaymentType.INSTALLMENT_PAYMENT
                )
        );
        if (hasPendingMajorPayment) {
            return "Payment Verification Pending";
        }

        return null;
    }

    public ReservationResponse toResponseWithCommitment(Reservation r) {
        if (r == null) return null;
        Long rId = r.getId();
        Long aId = r.getApartment() != null ? r.getApartment().getId() : null;

        List<PaymentPlan> plans = rId != null ? paymentPlanRepository.findByReservationIdOrderByCreatedAtDesc(rId) : List.of();
        List<Payment> payments = rId != null ? paymentRepository.findByReservationId(rId) : List.of();

        boolean hasCommitment = hasFinancialCommitment(r, plans, payments);
        String reason = hasCommitment ? getFinancialCommitmentReason(r, plans, payments) : null;

        Sale sale = aId != null ? saleRepository.findByApartmentId(aId).orElse(null) : null;
        boolean saleBelongsToThisRes = sale != null && (sale.getReservation() == null || (rId != null && rId.equals(sale.getReservation().getId())));
        boolean isAptSold = r.getApartment() != null && r.getApartment().getStatus() == ApartmentStatus.SOLD;
        boolean isCancelled = r.getStatus() == ReservationStatus.CANCELLED;
        boolean isExpired = r.getStatus() == ReservationStatus.EXPIRED;
        boolean isConfirmed = r.getStatus() == ReservationStatus.CONFIRMED;
        boolean isPending = r.getStatus() == ReservationStatus.PENDING;

        boolean hasCompletedSale = !isCancelled && !isExpired && ((sale != null && saleBelongsToThisRes) || (isAptSold && saleBelongsToThisRes));

        BigDecimal totalVerified = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED)
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal aptPrice = (r.getApartment() != null && r.getApartment().getPrice() != null)
                ? r.getApartment().getPrice() : BigDecimal.ZERO;
        boolean isFullPayment = (aptPrice.compareTo(BigDecimal.ZERO) > 0 && totalVerified.compareTo(aptPrice) >= 0)
                || payments.stream().anyMatch(p -> p.getStatus() == PaymentStatus.VERIFIED && p.getType() == PaymentType.FULL_PAYMENT);

        boolean isFullyPaid = !isCancelled && !isExpired && (isFullPayment || hasCompletedSale);
        String saleId = (hasCompletedSale && sale != null) ? IdParser.formatId("SAL", sale.getId()) : null;

        BigDecimal fee = r.getReservationFee() != null ? r.getReservationFee() : BigDecimal.ZERO;
        BigDecimal nonRefundable = fee;
        BigDecimal otherPaid = totalVerified.compareTo(fee) > 0 ? totalVerified.subtract(fee) : BigDecimal.ZERO;
        BigDecimal refundable = otherPaid;

        // Refund for this reservation
        ReservationRefund refund = rId != null ? reservationRefundRepository.findByReservationId(rId).orElse(null) : null;

        boolean reservationFeePaid = payments.stream().anyMatch(p ->
                p.getStatus() == PaymentStatus.VERIFIED && p.getType() == PaymentType.RESERVATION_FEE
        ) || (isConfirmed && !isCancelled && !isExpired);

        BigDecimal remainingBalance = (isCancelled || isExpired || isFullyPaid)
                ? BigDecimal.ZERO
                : (aptPrice.compareTo(BigDecimal.ZERO) > 0 ? aptPrice.subtract(totalVerified).max(BigDecimal.ZERO) : BigDecimal.ZERO);

        boolean refundCompleted = refund != null && refund.getRefundStatus() == RefundStatus.COMPLETED;
        boolean refundProcessed = refund != null && refund.getRefundStatus() == RefundStatus.PROCESSED;
        boolean financiallyClosed = (isCancelled || isExpired || refundCompleted) && !isFullyPaid && !hasCompletedSale;

        boolean canPayReservationFee = isPending && !reservationFeePaid && !isCancelled && !isExpired;
        boolean canRequestSettlement = !financiallyClosed && !isCancelled && !isExpired && reservationFeePaid && !isFullyPaid && remainingBalance.compareTo(BigDecimal.ZERO) > 0;
        boolean canConfirmRefund = refundProcessed;

        Integer settlementProgress = (isCancelled || isExpired)
                ? 0
                : (isFullyPaid
                        ? 100
                        : ((aptPrice.compareTo(BigDecimal.ZERO) > 0)
                                ? Math.min(100, totalVerified.multiply(new BigDecimal(100)).divide(aptPrice, 0, RoundingMode.HALF_UP).intValue())
                                : 0));

        String displayStatus;
        if (!isCancelled && !isExpired && isFullyPaid && hasCompletedSale) {
            displayStatus = "FULLY PAID • PURCHASED";
        } else if (!isCancelled && !isExpired && isFullyPaid) {
            displayStatus = "FULLY PAID • COMPLETION PENDING";
        } else if (isCancelled && refundCompleted) {
            displayStatus = "CANCELLED • REFUNDED";
        } else if (isCancelled && refundProcessed) {
            displayStatus = "CANCELLED • REFUND SENT";
        } else if (isCancelled) {
            displayStatus = "CANCELLED";
        } else if (isExpired) {
            displayStatus = "EXPIRED";
        } else if (isConfirmed || reservationFeePaid) {
            displayStatus = "RESERVED";
        } else {
            displayStatus = "PENDING";
        }

        String refundStatusStr = refund != null ? refund.getRefundStatus().getDisplayValue() : null;
        BigDecimal refundAmount = refund != null ? refund.getRefundAmount() : null;
        BigDecimal companyRetained = refund != null ? refund.getCompanyRetainedAmount() : null;
        String refundProcAt = (refund != null && refund.getProcessedAt() != null)
                ? refund.getProcessedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null;
        String custConfAt = (refund != null && refund.getCustomerConfirmedAt() != null)
                ? refund.getCustomerConfirmedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null;

        return ReservationResponse.fromEntity(r, hasCommitment, reason, hasCompletedSale, saleId, isFullyPaid,
                totalVerified, otherPaid, refundable, nonRefundable,
                reservationFeePaid, totalVerified, remainingBalance,
                refundStatusStr, refundAmount, companyRetained,
                refundProcAt, custConfAt,
                financiallyClosed, canPayReservationFee,
                canRequestSettlement, canConfirmRefund,
                settlementProgress, displayStatus);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> toResponseWithCommitmentList(List<Reservation> reservations) {
        if (reservations == null || reservations.isEmpty()) return List.of();

        Set<Long> resIds = reservations.stream().map(Reservation::getId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> aptIds = reservations.stream()
                .map(r -> r.getApartment() != null ? r.getApartment().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<PaymentPlan> allPlans = paymentPlanRepository.findByReservationIdIn(resIds);
        List<Payment> allPayments = paymentRepository.findByReservationIdIn(resIds);
        List<ReservationRefund> allRefunds = reservationRefundRepository.findByReservationIdIn(resIds);
        List<Sale> allSales = aptIds.isEmpty() ? List.of() : saleRepository.findByApartmentIdIn(aptIds);

        Map<Long, List<PaymentPlan>> plansByResId = allPlans.stream()
                .filter(p -> p.getReservation() != null && p.getReservation().getId() != null)
                .collect(Collectors.groupingBy(p -> p.getReservation().getId()));

        Map<Long, List<Payment>> paymentsByResId = allPayments.stream()
                .filter(p -> p.getReservation() != null && p.getReservation().getId() != null)
                .collect(Collectors.groupingBy(p -> p.getReservation().getId()));

        Map<Long, ReservationRefund> refundsByResId = allRefunds.stream()
                .filter(rf -> rf.getReservation() != null && rf.getReservation().getId() != null)
                .collect(Collectors.toMap(rf -> rf.getReservation().getId(), rf -> rf, (r1, r2) -> r1));

        Map<Long, Sale> salesByAptId = allSales.stream()
                .filter(s -> s.getApartment() != null && s.getApartment().getId() != null)
                .collect(Collectors.toMap(s -> s.getApartment().getId(), s -> s, (s1, s2) -> s1));

        return reservations.stream().map(r -> {
            Long rId = r.getId();
            Long aId = r.getApartment() != null ? r.getApartment().getId() : null;

            List<PaymentPlan> relatedPlans = (rId != null && plansByResId.containsKey(rId))
                    ? plansByResId.get(rId) : List.of();
            List<Payment> relatedPayments = (rId != null && paymentsByResId.containsKey(rId))
                    ? paymentsByResId.get(rId) : List.of();
            ReservationRefund refund = (rId != null && refundsByResId.containsKey(rId))
                    ? refundsByResId.get(rId) : null;

            boolean hasCommitment = hasFinancialCommitment(r, relatedPlans, relatedPayments);
            String reason = hasCommitment ? getFinancialCommitmentReason(r, relatedPlans, relatedPayments) : null;

            Sale sale = aId != null ? salesByAptId.get(aId) : null;
            boolean saleBelongsToThisRes = sale != null && (sale.getReservation() == null || (rId != null && rId.equals(sale.getReservation().getId())));
            Apartment apt = r.getApartment();
            boolean isAptSold = apt != null && apt.getStatus() == ApartmentStatus.SOLD;
            boolean isCancelled = r.getStatus() == ReservationStatus.CANCELLED;
            boolean isExpired = r.getStatus() == ReservationStatus.EXPIRED;
            boolean isConfirmed = r.getStatus() == ReservationStatus.CONFIRMED;
            boolean isPending = r.getStatus() == ReservationStatus.PENDING;

            boolean hasCompletedSale = !isCancelled && !isExpired && ((sale != null && saleBelongsToThisRes) || (isAptSold && saleBelongsToThisRes));

            BigDecimal totalVerified = relatedPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.VERIFIED)
                    .map(Payment::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal aptPrice = (apt != null && apt.getPrice() != null) ? apt.getPrice() : BigDecimal.ZERO;
            boolean isFullPayment = (aptPrice.compareTo(BigDecimal.ZERO) > 0 && totalVerified.compareTo(aptPrice) >= 0)
                    || relatedPayments.stream().anyMatch(p -> p.getStatus() == PaymentStatus.VERIFIED && p.getType() == PaymentType.FULL_PAYMENT);

            boolean isFullyPaid = !isCancelled && !isExpired && (isFullPayment || hasCompletedSale);
            String saleId = (hasCompletedSale && sale != null) ? IdParser.formatId("SAL", sale.getId()) : null;

            BigDecimal fee = r.getReservationFee() != null ? r.getReservationFee() : BigDecimal.ZERO;
            BigDecimal nonRefundable = fee;
            BigDecimal otherPaid = totalVerified.compareTo(fee) > 0 ? totalVerified.subtract(fee) : BigDecimal.ZERO;
            BigDecimal refundable = otherPaid;

            boolean reservationFeePaid = relatedPayments.stream().anyMatch(p ->
                    p.getStatus() == PaymentStatus.VERIFIED && p.getType() == PaymentType.RESERVATION_FEE
            ) || (isConfirmed && !isCancelled && !isExpired);

            BigDecimal remainingBalance = (isCancelled || isExpired || isFullyPaid)
                    ? BigDecimal.ZERO
                    : (aptPrice.compareTo(BigDecimal.ZERO) > 0 ? aptPrice.subtract(totalVerified).max(BigDecimal.ZERO) : BigDecimal.ZERO);

            boolean refundCompleted = refund != null && refund.getRefundStatus() == RefundStatus.COMPLETED;
            boolean refundProcessed = refund != null && refund.getRefundStatus() == RefundStatus.PROCESSED;
            boolean financiallyClosed = (isCancelled || isExpired || refundCompleted) && !isFullyPaid && !hasCompletedSale;

            boolean canPayReservationFee = isPending && !reservationFeePaid && !isCancelled && !isExpired;
            boolean canRequestSettlement = !financiallyClosed && !isCancelled && !isExpired && reservationFeePaid && !isFullyPaid && remainingBalance.compareTo(BigDecimal.ZERO) > 0;
            boolean canConfirmRefund = refundProcessed;

            Integer settlementProgress = (isCancelled || isExpired)
                    ? 0
                    : (isFullyPaid
                            ? 100
                            : ((aptPrice.compareTo(BigDecimal.ZERO) > 0)
                                    ? Math.min(100, totalVerified.multiply(new BigDecimal(100)).divide(aptPrice, 0, RoundingMode.HALF_UP).intValue())
                                    : 0));

            String displayStatus;
            if (!isCancelled && !isExpired && isFullyPaid && hasCompletedSale) {
                displayStatus = "FULLY PAID • PURCHASED";
            } else if (!isCancelled && !isExpired && isFullyPaid) {
                displayStatus = "FULLY PAID • COMPLETION PENDING";
            } else if (isCancelled && refundCompleted) {
                displayStatus = "CANCELLED • REFUNDED";
            } else if (isCancelled && refundProcessed) {
                displayStatus = "CANCELLED • REFUND SENT";
            } else if (isCancelled) {
                displayStatus = "CANCELLED";
            } else if (isExpired) {
                displayStatus = "EXPIRED";
            } else if (isConfirmed || reservationFeePaid) {
                displayStatus = "RESERVED";
            } else {
                displayStatus = "PENDING";
            }

            String refundStatusStr = refund != null ? refund.getRefundStatus().getDisplayValue() : null;
            BigDecimal refundAmount = refund != null ? refund.getRefundAmount() : null;
            BigDecimal companyRetained = refund != null ? refund.getCompanyRetainedAmount() : null;
            String refundProcAt = (refund != null && refund.getProcessedAt() != null)
                    ? refund.getProcessedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null;
            String custConfAt = (refund != null && refund.getCustomerConfirmedAt() != null)
                    ? refund.getCustomerConfirmedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null;

            return ReservationResponse.fromEntity(r, hasCommitment, reason, hasCompletedSale, saleId, isFullyPaid,
                    totalVerified, otherPaid, refundable, nonRefundable,
                    reservationFeePaid, totalVerified, remainingBalance,
                    refundStatusStr, refundAmount, companyRetained,
                    refundProcAt, custConfAt,
                    financiallyClosed, canPayReservationFee,
                    canRequestSettlement, canConfirmRefund,
                    settlementProgress, displayStatus);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservations(UserPrincipal principal, String customerParam) {
        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        List<Reservation> reservations;
        if (isStaffOrAdmin) {
            if (customerParam != null && !customerParam.trim().isEmpty()) {
                reservations = reservationRepository.findByCustomerEmailWithDetails(customerParam.trim());
            } else {
                reservations = reservationRepository.findAllWithDetails();
            }
        } else {
            Long customerId = principal != null ? principal.getId() : null;
            if (customerId == null && customerParam != null) {
                reservations = reservationRepository.findByCustomerEmailWithDetails(customerParam.trim());
            } else if (customerId != null) {
                reservations = reservationRepository.findByCustomerIdWithDetails(customerId);
            } else {
                return List.of();
            }
        }

        return toResponseWithCommitmentList(reservations);
    }

    public ReservationResponse getReservationById(Long id) {
        return reservationRepository.findById(id)
                .map(this::toResponseWithCommitment)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
    }

    public Reservation getReservationEntityById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
    }

    public ReservationDetailsResponse getReservationDetails(Long id) {
        Reservation reservation = getReservationEntityById(id);
        ReservationResponse resDto = toResponseWithCommitment(reservation);
        UserDto custDto = reservation.getCustomer() != null ? UserDto.fromEntity(reservation.getCustomer()) : null;
        ApartmentResponse aptDto = reservation.getApartment() != null ? ApartmentResponse.fromEntity(reservation.getApartment()) : null;

        // Appointment
        Appointment appointment = reservation.getAppointment();
        if (appointment == null && reservation.getCustomer() != null && reservation.getApartment() != null) {
            appointment = appointmentRepository.findFirstByApartmentIdAndCustomerIdAndStatusOrderByDateDesc(
                    reservation.getApartment().getId(),
                    reservation.getCustomer().getId(),
                    AppointmentStatus.COMPLETED
            ).orElse(null);
        }
        AppointmentResponse apptDto = appointment != null ? AppointmentResponse.fromEntity(appointment) : null;

        // Payments - strictly for this reservation
        List<Payment> payments = paymentRepository.findByReservationId(reservation.getId());
        List<PaymentResponse> allPaymentResponses = payments.stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());

        Payment primaryPayment = payments.stream()
                .filter(p -> p.getType() == PaymentType.RESERVATION_FEE)
                .findFirst()
                .orElse(payments.isEmpty() ? null : payments.get(0));
        PaymentResponse paymentDto = primaryPayment != null ? PaymentResponse.fromEntity(primaryPayment) : null;

        // Refund record if exists
        ReservationRefund refundEntity = reservationRefundRepository.findByReservationId(reservation.getId())
                .orElse(null);
        ReservationRefundResponse refundDto = refundEntity != null ? ReservationRefundResponse.fromEntity(refundEntity) : null;

        RefundEligibilityResponse eligibility = computeRefundEligibility(reservation, primaryPayment, refundEntity);

        return ReservationDetailsResponse.builder()
                .reservation(resDto)
                .customer(custDto)
                .apartment(aptDto)
                .appointment(apptDto)
                .payment(paymentDto)
                .allPayments(allPaymentResponses)
                .refund(refundDto)
                .refundEligible(eligibility != null ? eligibility.isEligible() : false)
                .refundDeadline(eligibility != null ? eligibility.getRefundDeadline() : null)
                .refundAmount(eligibility != null ? eligibility.getRefundAmount() : null)
                .refundStatus(refundEntity != null ? refundEntity.getRefundStatus().getDisplayValue() : (eligibility != null ? eligibility.getRefundStatus() : null))
                .remainingRefundSeconds(eligibility != null ? eligibility.getRemainingSeconds() : 0L)
                .successfulPaymentTime(eligibility != null ? eligibility.getSuccessfulPaymentTime() : null)
                .cancellationAllowed(eligibility != null ? eligibility.isCancellable() : false)
                .holdActive(resDto != null ? resDto.isHoldActive() : false)
                .holdExpiresAt(resDto != null ? resDto.getHoldExpiresAt() : null)
                .remainingHoldSeconds(resDto != null ? resDto.getRemainingHoldSeconds() : 0L)
                .cancellationDeadline(resDto != null ? resDto.getCancellationDeadline() : null)
                .cancellationEligible(resDto != null ? resDto.isCancellationEligible() : false)
                .remainingCancellationSeconds(resDto != null ? resDto.getRemainingCancellationSeconds() : 0L)
                .reservationFeeConfirmedAt(resDto != null ? resDto.getReservationFeeConfirmedAt() : null)
                .build();
    }

    public RefundEligibilityResponse computeRefundEligibility(Reservation reservation, Payment primaryPayment, ReservationRefund existingRefund) {
        if (reservation == null) return null;

        String rsvId = IdParser.formatId("RSV", reservation.getId());
        BigDecimal fee = reservation.getReservationFee() != null ? reservation.getReservationFee() : BigDecimal.ZERO;

        // 1. If refund record already exists:
        if (existingRefund != null) {
            return RefundEligibilityResponse.builder()
                    .reservationId(rsvId)
                    .eligible(false)
                    .cancellable(false)
                    .refundAmount(existingRefund.getRefundAmount())
                    .reservationFee(fee)
                    .successfulPaymentTime(existingRefund.getPayment() != null && existingRefund.getPayment().getVerifiedAt() != null 
                            ? existingRefund.getPayment().getVerifiedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null)
                    .refundDeadline(null)
                    .remainingSeconds(0L)
                    .refundStatus(existingRefund.getRefundStatus() != null ? existingRefund.getRefundStatus().getDisplayValue() : null)
                    .reason("Refund has already been recorded for this reservation (" + existingRefund.getRefundStatus() + ").")
                    .build();
        }

        // 2. If reservation is already cancelled:
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            return RefundEligibilityResponse.builder()
                    .reservationId(rsvId)
                    .eligible(false)
                    .cancellable(false)
                    .refundAmount(BigDecimal.ZERO)
                    .reservationFee(fee)
                    .remainingSeconds(0L)
                    .refundStatus("Already Cancelled")
                    .reason("This reservation has already been cancelled.")
                    .build();
        }

        // 3. If apartment has completed sale:
        if (reservation.getApartment() != null && saleRepository.findByApartmentId(reservation.getApartment().getId()).isPresent()) {
            return RefundEligibilityResponse.builder()
                    .reservationId(rsvId)
                    .eligible(false)
                    .cancellable(false)
                    .refundAmount(BigDecimal.ZERO)
                    .reservationFee(fee)
                    .remainingSeconds(0L)
                    .refundStatus("Sale Completed")
                    .reason("A completed sale deed is already registered for this apartment.")
                    .build();
        }

        // 4. If financial commitment exists (full payment, active plan, part payment):
        if (hasFinancialCommitment(reservation)) {
            String commReason = getFinancialCommitmentReason(reservation);
            return RefundEligibilityResponse.builder()
                    .reservationId(rsvId)
                    .eligible(false)
                    .cancellable(false)
                    .refundAmount(BigDecimal.ZERO)
                    .reservationFee(fee)
                    .remainingSeconds(0L)
                    .refundStatus("Commitment Active")
                    .reason("Reservation has an active financial commitment: " + (commReason != null ? commReason : "Active payment commitment"))
                    .build();
        }

        // 5. If reservation is still pending payment:
        if (reservation.getStatus() == ReservationStatus.PENDING) {
            return RefundEligibilityResponse.builder()
                    .reservationId(rsvId)
                    .eligible(false)
                    .cancellable(false)
                    .refundAmount(BigDecimal.ZERO)
                    .reservationFee(fee)
                    .remainingSeconds(0L)
                    .refundStatus("Awaiting Fee Confirmation")
                    .reason("Reservation fee payment has not been confirmed yet. Hold and cancellation windows start after confirmation.")
                    .build();
        }

        // 6. Must have verified reservation payment:
        if (primaryPayment == null || primaryPayment.getStatus() != PaymentStatus.VERIFIED) {
            return RefundEligibilityResponse.builder()
                    .reservationId(rsvId)
                    .eligible(false)
                    .cancellable(false)
                    .refundAmount(BigDecimal.ZERO)
                    .reservationFee(fee)
                    .remainingSeconds(0L)
                    .refundStatus("Unverified Payment")
                    .reason("Reservation deposit payment has not been verified yet.")
                    .build();
        }

        // 7. Authoritative successful payment time from fee confirmation
        LocalDateTime paymentTime = reservation.getReservationFeeConfirmedAt();
        if (paymentTime == null && primaryPayment != null) {
            paymentTime = primaryPayment.getVerifiedAt() != null 
                    ? primaryPayment.getVerifiedAt() 
                    : primaryPayment.getUploadedAt();
        }
        if (paymentTime == null) {
            return RefundEligibilityResponse.builder()
                    .reservationId(rsvId)
                    .eligible(false)
                    .cancellable(false)
                    .refundAmount(BigDecimal.ZERO)
                    .reservationFee(fee)
                    .remainingSeconds(0L)
                    .refundStatus("Unverified Payment")
                    .reason("Reservation fee payment confirmation timestamp is not available.")
                    .build();
        }

        LocalDateTime deadline = reservation.getCancellationDeadline() != null
                ? reservation.getCancellationDeadline()
                : paymentTime.plusHours(48);
        LocalDateTime now = getCurrentDateTime();
        boolean isEligible = !now.isAfter(deadline);
        long remainingSeconds = isEligible ? Math.max(0, Duration.between(now, deadline).getSeconds()) : 0L;
        BigDecimal authoritativeRefundAmount = primaryPayment.getAmount() != null ? primaryPayment.getAmount() : fee;

        return RefundEligibilityResponse.builder()
                .reservationId(rsvId)
                .eligible(isEligible)
                .cancellable(isEligible && reservation.getStatus() == ReservationStatus.CONFIRMED)
                .refundAmount(authoritativeRefundAmount)
                .reservationFee(fee)
                .successfulPaymentTime(paymentTime.format(DateTimeFormatter.ISO_DATE_TIME))
                .refundDeadline(deadline.format(DateTimeFormatter.ISO_DATE_TIME))
                .remainingSeconds(remainingSeconds)
                .refundStatus(isEligible ? "Eligible" : "Expired")
                .reason(isEligible ? "Eligible for full deposit refund within 48 hours of payment" : "48-hour refund period expired")
                .build();
    }

    public RefundEligibilityResponse getRefundEligibility(Long reservationId) {
        Reservation reservation = getReservationEntityById(reservationId);
        Payment payment = findAssociatedReservationPayment(reservation.getId());
        ReservationRefund refund = reservationRefundRepository.findByReservationId(reservation.getId()).orElse(null);
        return computeRefundEligibility(reservation, payment, refund);
    }

    public List<ReservationRefundResponse> getAllRefunds() {
        return reservationRefundRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(ReservationRefundResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReservationResponse createReservation(UserPrincipal principal, ReservationRequest request) {
        Long aptId = IdParser.parseId(request.getApartmentId());
        Apartment apartment = apartmentRepository.findByIdWithLock(aptId)
                .orElseGet(() -> apartmentRepository.findById(aptId)
                        .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + aptId)));

        User customer;
        if (principal != null) {
            customer = principal.getUser();
        } else if (request.getCustomerEmail() != null) {
            customer = userService.getUserEntityByEmail(request.getCustomerEmail());
        } else {
            throw new BadRequestException("Customer authentication or email required");
        }

        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        // Rule 1: A customer must have a COMPLETED viewing appointment before creating a reservation
        Appointment completedAppointment = null;
        if (request.getAppointmentId() != null && !request.getAppointmentId().trim().isEmpty()) {
            Long apptId = IdParser.parseId(request.getAppointmentId());
            Appointment found = appointmentRepository.findById(apptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Viewing appointment not found with id: " + apptId));

            if (!found.getCustomer().getId().equals(customer.getId()) ||
                !found.getApartment().getId().equals(apartment.getId())) {
                throw new BadRequestException("The viewing appointment does not match this customer and apartment.");
            }
            if (found.getStatus() != AppointmentStatus.COMPLETED) {
                throw new BadRequestException("Reservation can only be created after the viewing appointment has reached 'Completed' status (Current status: " + found.getStatus().getDisplayValue() + ").");
            }
            if (found.getRescheduleStatus() != com.skyline.enums.RescheduleStatus.NONE) {
                throw new BadRequestException("Reservation cannot be created while an appointment reschedule proposal is pending.");
            }
            completedAppointment = found;
        } else {
            // Find latest COMPLETED appointment for this customer + apartment
            Optional<Appointment> optAppt = appointmentRepository.findFirstByApartmentIdAndCustomerIdAndStatusOrderByDateDesc(
                    apartment.getId(),
                    customer.getId(),
                    AppointmentStatus.COMPLETED
            );
            if (optAppt.isPresent()) {
                completedAppointment = optAppt.get();
                if (completedAppointment.getRescheduleStatus() != com.skyline.enums.RescheduleStatus.NONE) {
                    throw new BadRequestException("Reservation cannot be created while an appointment reschedule proposal is pending.");
                }
            } else {
                throw new BadRequestException("Reservation can only be created after an on-site viewing appointment has been completed for this residence. Please book and complete your viewing appointment first.");
            }
        }

        // Rule 2: Apartment must NOT be SOLD
        if (apartment.getStatus() == ApartmentStatus.SOLD || availabilityService.isApartmentSold(apartment.getId())) {
            throw new ConflictException("Apartment is already sold and cannot be reserved.");
        }

        // Rule 3: Apartment must be AVAILABLE
        if (apartment.getStatus() != ApartmentStatus.AVAILABLE) {
            throw new ConflictException("Apartment is not available for reservation (Current status: " + apartment.getStatus().getDisplayValue() + ")");
        }

        // Rule 4: Prevent duplicate active reservations
        boolean hasActive = reservationRepository.existsByApartmentIdAndStatusIn(
                apartment.getId(),
                Arrays.asList(ReservationStatus.PENDING, ReservationStatus.CONFIRMED)
        );
        if (hasActive) {
            throw new ConflictException("Apartment already has an active reservation.");
        }

        // Reservation fee = 10% of apartment price
        BigDecimal fee = apartment.getPrice()
                .multiply(new BigDecimal("0.10"))
                .setScale(2, java.math.RoundingMode.HALF_UP);

        Reservation reservation = Reservation.builder()
                .apartment(apartment)
                .customer(customer)
                .appointment(completedAppointment)
                .customerName(request.getCustomerName() != null ? request.getCustomerName() : customer.getName())
                .customerEmail(request.getCustomerEmail() != null ? request.getCustomerEmail() : customer.getEmail())
                .reservationFee(fee)
                .status(ReservationStatus.PENDING)
                .expiresAt(null)
                .reservationFeeConfirmedAt(null)
                .cancellationDeadline(null)
                .createdAt(getCurrentDateTime())
                .build();

        // Apartment becomes RESERVED via centralized availability service
        availabilityService.markReserved(apartment);

        Reservation saved = reservationRepository.save(reservation);

        // Notify customer
        notificationSubject.notifyObservers(new NotificationEvent(
                customer,
                NotificationType.RESERVATION,
                "Reservation Placed - Payment Required",
                "Your reservation for " + apartment.getTitle()
                        + " has been placed. The reservation fee is 10% of the apartment price ("
                        + fee
                        + "). Please upload the reservation fee payment proof to confirm your reservation. Your 4-day reservation hold will begin once your payment is confirmed."
        ));

        return toResponseWithCommitment(saved);
    }

    @Transactional
    public ReservationRefundResponse cancelReservationWithRefund(Long id, ReservationCancellationRequest request, UserPrincipal principal) {
        Reservation reservation = getReservationEntityById(id);

        // 1. Authorization check: logged-in customer must own the reservation (unless staff or admin)
        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN
        );

        if (!isStaffOrAdmin) {
            if (principal == null || reservation.getCustomer() == null ||
                !reservation.getCustomer().getId().equals(principal.getId())) {
                throw new ForbiddenException("You are not authorized to cancel this reservation.");
            }
        }

        // 2. Already cancelled check
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BadRequestException("This reservation is already cancelled.");
        }

        // 3. Completed sale deed check
        if (reservation.getApartment() != null && reservation.getApartment().getId() != null) {
            if (saleRepository.findByApartmentId(reservation.getApartment().getId()).isPresent()) {
                throw new BadRequestException("Reservation cannot be cancelled because a completed sale deed is already registered for this apartment.");
            }
        }

        // 4. Financial commitment check (full payment, part payment, active payment plan)
        if (hasFinancialCommitment(reservation)) {
            String commReason = getFinancialCommitmentReason(reservation);
            throw new BadRequestException("Reservation cannot be cancelled because a payment or active payment plan is associated with this reservation."
                    + (commReason != null ? " (" + commReason + ")" : ""));
        }

        // 5. Duplicate refund check
        if (reservationRefundRepository.existsByReservationId(reservation.getId())) {
            throw new ConflictException("A refund/financial record has already been processed for this reservation.");
        }

        // 6. Payment record check
        Payment payment = findAssociatedReservationPayment(reservation.getId());

        if (payment == null || payment.getStatus() != PaymentStatus.VERIFIED) {
            throw new BadRequestException("Reservation payment was not found or has not been successfully verified.");
        }

        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BadRequestException("Only confirmed reservations with verified deposits can be cancelled with a refund.");
        }

        // 7. 48-Hour Refund Period check
        // Start timestamp is the authoritative reservation fee confirmation timestamp
        LocalDateTime paymentTime = reservation.getReservationFeeConfirmedAt();
        if (paymentTime == null && payment != null) {
            paymentTime = payment.getVerifiedAt() != null 
                    ? payment.getVerifiedAt() 
                    : payment.getUploadedAt();
        }
        if (paymentTime == null) {
            throw new BadRequestException("Reservation fee confirmation timestamp is not available. Cancellation is not allowed.");
        }

        LocalDateTime refundDeadline = reservation.getCancellationDeadline() != null
                ? reservation.getCancellationDeadline()
                : paymentTime.plusHours(48);
        LocalDateTime now = getCurrentDateTime();

        // 8. Distinguish Initiator and Business Logic
        BigDecimal depositAmount = payment.getAmount() != null ? payment.getAmount() : reservation.getReservationFee();
        BigDecimal refundAmount;
        BigDecimal companyRetained;
        RefundStatus initialStatus;
        String initiatorRole;
        Long initiatedByUserId = principal != null ? principal.getId() : null;
        String initiatedByName = principal != null ? principal.getUser().getName() : "Customer";
        String notifTitle;
        String notifBody;
        String message;

        String aptTitle = reservation.getApartment() != null ? reservation.getApartment().getTitle() : "the residence";

        if (isStaffOrAdmin) {
            // =========================================================================
            // SCENARIO B: ADMIN OR STAFF INITIATES CANCELLATION
            // Rule: Customer MUST receive a 100% refund (companyRetained = 0, refundAmount = originalFee).
            // Backend enforced. Since there is no automatic gateway, status is PENDING_PAYMENT.
            // =========================================================================
            initiatorRole = principal.getUser().getRole().name();
            companyRetained = BigDecimal.ZERO;
            refundAmount = depositAmount;
            initialStatus = RefundStatus.PENDING_PAYMENT;
            notifTitle = "Reservation Cancelled by Management";
            notifBody = "Your reservation for " + aptTitle + " has been cancelled by management. A full refund obligation of Rs. "
                    + refundAmount + " has been created and is awaiting manual payment disbursement.";
            message = "Reservation cancelled by management. Full refund obligation of Rs. " + refundAmount + " recorded and awaiting disbursement.";
        } else {
            // =========================================================================
            // SCENARIO A: CUSTOMER INITIATES CANCELLATION
            // Rule: Customer can request cancellation ONLY within 48h from successful payment.
            // 48h eligibility does NOT mean automatic full refund. It means request is PENDING_REVIEW.
            // Refund amount and company retained amount remain UNSET / PENDING DECISION until review.
            // =========================================================================
            if (now.isAfter(refundDeadline)) {
                throw new BadRequestException("REFUND_WINDOW_EXPIRED: The 48-hour refund period has expired for this reservation. Refund deadline was: " + refundDeadline);
            }
            initiatorRole = "CUSTOMER";
            companyRetained = null; // Unset / pending review
            refundAmount = null;    // Unset / pending review
            initialStatus = RefundStatus.PENDING_REVIEW;
            notifTitle = "Reservation Cancellation Requested";
            notifBody = "Your cancellation request for " + aptTitle + " has been submitted and is awaiting administrative review. The final refund amount will be determined upon review.";
            message = "Cancellation request submitted successfully. Awaiting administrative review.";
        }

        // 9. Cancel any active or pending payment plans for this reservation
        List<PaymentPlan> plans = paymentPlanRepository.findByReservationIdOrderByCreatedAtDesc(reservation.getId());
        for (PaymentPlan p : plans) {
            if (p.getStatus() == PaymentPlanStatus.PENDING || p.getStatus() == PaymentPlanStatus.AWAITING_CUSTOMER || p.getStatus() == PaymentPlanStatus.APPROVED) {
                p.setStatus(PaymentPlanStatus.CANCELLED);
                paymentPlanRepository.save(p);
            }
        }

        // 10. Update reservation status
        reservation.setStatus(ReservationStatus.CANCELLED);
        Reservation savedReservation = reservationRepository.save(reservation);

        // 11. Update apartment availability safely if eligible
        if (reservation.getApartment() != null) {
            updateApartmentAvailabilityAfterReservationChange(reservation.getApartment().getId());
        }

        // 12. Factory Pattern: Create and save refund product
        ReservationRefund refundRecord;
        if (isStaffOrAdmin) {
            refundRecord = reservationRefundFactory.createManagementCancellationRefund(
                    savedReservation, payment, request, principal, depositAmount);
        } else {
            refundRecord = reservationRefundFactory.createCustomerCancellationRefund(
                    savedReservation, payment, request, principal, depositAmount);
        }
        if (request != null && request.getNotes() != null) {
            refundRecord.setNotes(request.getNotes());
        }

        ReservationRefund savedRefund = reservationRefundRepository.save(refundRecord);

        // 13. Notify customer
        notificationSubject.notifyObservers(new NotificationEvent(
                reservation.getCustomer(),
                NotificationType.RESERVATION,
                notifTitle,
                notifBody
        ));

        ReservationRefundResponse response = ReservationRefundResponse.fromEntity(savedRefund);
        response.setReservationStatus("CANCELLED");
        response.setRefundEligible(true);
        response.setRefundRequestedAt(now.format(DateTimeFormatter.ISO_DATE_TIME));
        response.setMessage(message);
        return response;
    }

    @Transactional
    public ReservationRefundResponse reviewAndApproveSettlement(Long refundId, RefundSettlementRequest request, UserPrincipal principal) {
        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN
        );
        if (!isStaffOrAdmin) {
            throw new ForbiddenException("Only management staff or admin can review and settle cancellation refunds.");
        }

        ReservationRefund refund = reservationRefundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund record not found with id: " + refundId));

        if (refund.getRefundStatus() == RefundStatus.COMPLETED) {
            throw new BadRequestException("This refund has already been completed and settlement cannot be modified.");
        }

        if (refund.getRefundStatus() != RefundStatus.PENDING_REVIEW && refund.getRefundStatus() != RefundStatus.PENDING) {
            throw new BadRequestException("Only cancellation requests pending review can be reviewed and approved.");
        }

        if (request == null || request.getCompanyRetainedAmount() == null) {
            throw new BadRequestException("Company retained amount is required.");
        }

        BigDecimal retained = request.getCompanyRetainedAmount();
        if (retained.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Company retained amount cannot be negative.");
        }

        BigDecimal originalFee = refund.getOriginalFee();
        if (retained.compareTo(originalFee) > 0) {
            throw new BadRequestException("Company retained amount (Rs. " + retained + ") cannot exceed original reservation fee (Rs. " + originalFee + ").");
        }

        BigDecimal calculatedRefund = originalFee.subtract(retained);
        LocalDateTime now = getCurrentDateTime();
        String reviewerName = principal.getUser().getName();

        refund.setCompanyRetainedAmount(retained);
        refund.setRefundAmount(calculatedRefund);
        refund.setReviewedBy(reviewerName);
        refund.setReviewedAt(now);
        refund.setSettlementNote(request.getSettlementNote());
        refund.setRefundStatus(RefundStatus.PENDING_PAYMENT);
        refund.setUpdatedAt(now);

        ReservationRefund saved = reservationRefundRepository.save(refund);

        notificationSubject.notifyObservers(new NotificationEvent(
                saved.getCustomer(),
                NotificationType.RESERVATION,
                "Cancellation Settlement Approved",
                "Your reservation cancellation has been reviewed: Company retained Rs. " + retained
                        + ", Approved refund Rs. " + calculatedRefund + ". Refund is awaiting manual payment disbursement."
        ));

        ReservationRefundResponse resp = ReservationRefundResponse.fromEntity(saved);
        resp.setMessage("Cancellation settlement approved successfully. Refund is awaiting payment.");
        return resp;
    }

    @Transactional
    public ReservationRefundResponse recordRefundPayment(Long refundId, RecordRefundPaymentRequest request, UserPrincipal principal) {
        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN
        );
        if (!isStaffOrAdmin) {
            throw new ForbiddenException("Only management staff or admin can record refund payments.");
        }

        ReservationRefund refund = reservationRefundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund record not found with id: " + refundId));

        if (refund.getRefundStatus() == RefundStatus.COMPLETED) {
            throw new BadRequestException("This refund has already been completed.");
        }

        if (refund.getRefundStatus() == RefundStatus.PROCESSED) {
            throw new BadRequestException("This refund payment has already been marked as sent and is awaiting customer confirmation.");
        }

        if (refund.getRefundStatus() == RefundStatus.PENDING_REVIEW || refund.getRefundStatus() == RefundStatus.PENDING) {
            throw new BadRequestException("This cancellation request is still pending review and must be approved before payment can be recorded.");
        }

        if (request == null || request.getRefundMethod() == null || request.getRefundMethod().trim().isEmpty()) {
            throw new BadRequestException("Refund payment method is required (e.g. Bank Transfer, Cash, Other).");
        }

        LocalDateTime now = getCurrentDateTime();
        String processorName = principal.getUser().getName();

        boolean hasDisbursement = refund.getRefundAmount() != null && refund.getRefundAmount().compareTo(BigDecimal.ZERO) > 0;
        RefundStatus targetStatus = hasDisbursement ? RefundStatus.PROCESSED : RefundStatus.COMPLETED;

        refund.setRefundStatus(targetStatus);
        refund.setProcessedBy(processorName);
        refund.setProcessedAt(now);
        refund.setRefundMethod(request.getRefundMethod().trim());
        refund.setTransactionReference(request.getTransactionReference() != null ? request.getTransactionReference().trim() : null);
        refund.setNotes(request.getInternalNote());
        refund.setProofUrl(request.getProofUrl());
        refund.setUpdatedAt(now);

        ReservationRefund saved = reservationRefundRepository.save(refund);

        String aptTitle = (refund.getReservation() != null && refund.getReservation().getApartment() != null)
                ? refund.getReservation().getApartment().getTitle()
                : "Apartment";
        String rsvCode = (refund.getReservation() != null && refund.getReservation().getId() != null)
                ? "RSV-" + refund.getReservation().getId()
                : "";

        DecimalFormat df = new DecimalFormat("#,##0.00");
        String formattedAmount = df.format(saved.getRefundAmount() != null ? saved.getRefundAmount() : BigDecimal.ZERO);

        if (hasDisbursement) {
            notificationSubject.notifyObservers(new NotificationEvent(
                    saved.getCustomer(),
                    NotificationType.PAYMENT,
                    "Refund Sent",
                    "Your refund of Rs. " + formattedAmount + " for reservation #" + rsvCode
                            + " (" + aptTitle + ") has been processed. Please confirm once the amount is received."
            ));
        } else {
            notificationSubject.notifyObservers(new NotificationEvent(
                    saved.getCustomer(),
                    NotificationType.PAYMENT,
                    "Cancellation Settlement Completed",
                    "Financial settlement for reservation #" + rsvCode + " (" + aptTitle + ") has been completed."
            ));
        }

        ReservationRefundResponse resp = ReservationRefundResponse.fromEntity(saved);
        resp.setMessage(hasDisbursement 
                ? "Refund payment has been marked as sent. Awaiting customer confirmation."
                : "Cancellation settlement has been marked as completed.");
        return resp;
    }

    @Transactional
    public ReservationRefundResponse confirmRefundReceipt(Long refundId, UserPrincipal principal) {
        if (principal == null) {
            throw new ForbiddenException("Authentication required to confirm refund receipt.");
        }
        ReservationRefund refund = reservationRefundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund record not found with id: " + refundId));

        if (refund.getRefundStatus() == RefundStatus.COMPLETED) {
            ReservationRefundResponse resp = ReservationRefundResponse.fromEntity(refund);
            resp.setMessage("Refund receipt has already been confirmed.");
            return resp;
        }

        if (refund.getRefundStatus() != RefundStatus.PROCESSED) {
            throw new BadRequestException("Refund cannot be confirmed before admin has marked it as sent.");
        }

        // Authorization check: Customer must be the owner, or Admin/Staff
        boolean isOwner = refund.getCustomer() != null && refund.getCustomer().getId().equals(principal.getUser().getId());
        boolean isStaffOrAdmin = principal.getUser().getRole() == UserRole.STAFF || principal.getUser().getRole() == UserRole.ADMIN;
        if (!isOwner && !isStaffOrAdmin) {
            throw new ForbiddenException("You are not authorized to confirm this refund.");
        }

        LocalDateTime now = getCurrentDateTime();
        refund.setRefundStatus(RefundStatus.COMPLETED);
        refund.setCustomerConfirmedAt(now);
        refund.setCustomerConfirmedBy(principal.getUser().getName());
        refund.setCustomerConfirmedUserId(principal.getUser().getId());
        refund.setUpdatedAt(now);

        ReservationRefund saved = reservationRefundRepository.save(refund);

        DecimalFormat df = new DecimalFormat("#,##0.00");
        String formattedAmount = df.format(saved.getRefundAmount() != null ? saved.getRefundAmount() : BigDecimal.ZERO);

        notificationSubject.notifyObservers(new NotificationEvent(
                saved.getCustomer(),
                NotificationType.PAYMENT,
                "Refund Confirmed",
                "You have confirmed receipt of your refund of Rs. " + formattedAmount + ". The reservation is now financially closed."
        ));

        ReservationRefundResponse resp = ReservationRefundResponse.fromEntity(saved);
        resp.setMessage("Refund receipt confirmed successfully. Reservation is now financially closed.");
        return resp;
    }

    @Transactional
    public ReservationRefundResponse confirmRefundReceiptByReservationId(Long reservationId, UserPrincipal principal) {
        ReservationRefund refund = reservationRefundRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("No refund record found for reservation id: " + reservationId));
        return confirmRefundReceipt(refund.getId(), principal);
    }

    @Transactional
    public ReservationRefundResponse processPendingRefund(Long refundId, UserPrincipal principal) {
        RecordRefundPaymentRequest req = RecordRefundPaymentRequest.builder()
                .refundMethod("Bank Transfer")
                .transactionReference("REF-PAY-" + System.currentTimeMillis())
                .internalNote("Administrative manual settlement")
                .build();
        return recordRefundPayment(refundId, req, principal);
    }

    @Transactional
    public ReservationRefundResponse processExpiredRefund(Long id, ReservationCancellationRequest request, UserPrincipal principal) {
        Reservation reservation = getReservationEntityById(id);

        if (reservation.getStatus() != ReservationStatus.EXPIRED) {
            throw new BadRequestException("Only expired reservations can be processed via this action.");
        }

        if (reservationRefundRepository.existsByReservationId(reservation.getId())) {
            throw new ConflictException("A refund/settlement has already been recorded for this expired reservation.");
        }

        List<Payment> payments = paymentRepository.findByReservationId(reservation.getId());
        BigDecimal totalVerifiedPaid = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED)
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal reservationFee = reservation.getReservationFee() != null ? reservation.getReservationFee() : BigDecimal.ZERO;
        BigDecimal otherPaidAmount = totalVerifiedPaid.compareTo(reservationFee) > 0
                ? totalVerifiedPaid.subtract(reservationFee)
                : BigDecimal.ZERO;

        BigDecimal refundAmount = request.getRefundAmount();
        BigDecimal companyRetained = request.getCompanyRetainedAmount();

        validateRefundCalculation(totalVerifiedPaid, reservationFee, otherPaidAmount, refundAmount, companyRetained);

        // Find associated payment strictly for this reservation
        Payment payment = findAssociatedReservationPayment(reservation.getId());

        String processorName = principal != null ? principal.getUser().getName() : "Management Staff";
        BigDecimal recordedBasis = totalVerifiedPaid.compareTo(BigDecimal.ZERO) > 0 ? totalVerifiedPaid : reservationFee;

        // Factory Pattern: Create Expired Reservation Refund product
        ReservationRefund refundRecord = reservationRefundFactory.createExpiredReservationRefund(
                reservation, payment, request, principal, recordedBasis, companyRetained);
        if (refundAmount != null) {
            refundRecord.setRefundAmount(refundAmount);
        }
        if (request != null && request.getNotes() != null) {
            refundRecord.setNotes(request.getNotes());
        }
        refundRecord.setProcessedBy(processorName);
        refundRecord.setProcessedAt(LocalDateTime.now());

        ReservationRefund savedRefund = reservationRefundRepository.save(refundRecord);

        // Notify customer
        notificationSubject.notifyObservers(new NotificationEvent(
                reservation.getCustomer(),
                NotificationType.RESERVATION,
                "Expired Reservation Settlement Processed",
                "Financial settlement for your expired reservation on " + reservation.getApartment().getTitle()
                        + " has been recorded. Non-refundable reservation fee: " + reservationFee + ", Customer refund: " + refundAmount + ", Company retained: " + companyRetained + "."
        ));

        return ReservationRefundResponse.fromEntity(savedRefund);
    }

    private void validateRefundCalculation(BigDecimal totalPaid, BigDecimal reservationFee, BigDecimal otherPaidAmount,
                                           BigDecimal refundAmount, BigDecimal companyRetained) {
        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Refund amount cannot be negative.");
        }
        if (companyRetained == null || companyRetained.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Company retained amount cannot be negative.");
        }
        if (refundAmount.compareTo(otherPaidAmount) > 0) {
            throw new BadRequestException("Refund amount (" + refundAmount + ") cannot exceed refundable other payments (" + otherPaidAmount
                    + "). The reservation fee of " + reservationFee + " is strictly non-refundable.");
        }
        BigDecimal sum = refundAmount.add(companyRetained);
        BigDecimal basis = totalPaid.compareTo(BigDecimal.ZERO) > 0 ? totalPaid : reservationFee;
        if (sum.compareTo(basis) != 0) {
            throw new BadRequestException("Refund amount (" + refundAmount + ") + Company retained amount (" + companyRetained
                    + ") must exactly equal total payments recorded (" + basis + ").");
        }
        if (companyRetained.compareTo(reservationFee) < 0 && totalPaid.compareTo(reservationFee) >= 0) {
            throw new BadRequestException("Company retained amount (" + companyRetained
                    + ") must include at least the non-refundable reservation fee (" + reservationFee + ").");
        }
    }

    private Payment findAssociatedReservationPayment(Long reservationId) {
        List<Payment> payments = paymentRepository.findByReservationId(reservationId);
        if (!payments.isEmpty()) {
            return payments.stream()
                    .filter(p -> p.getType() == PaymentType.RESERVATION_FEE)
                    .findFirst()
                    .orElse(payments.get(0));
        }
        return null;
    }

    @Transactional
    public void updateApartmentAvailabilityAfterReservationChange(Long apartmentId) {
        if (availabilityService != null) {
            availabilityService.updateApartmentAvailabilityAfterReservationChange(apartmentId);
        }
    }

    @Transactional
    public ReservationResponse updateStatus(Long id, ReservationStatusUpdate update, UserPrincipal principal) {
        Reservation reservation = getReservationEntityById(id);
        ReservationStatus newStatus = update.getStatus();

        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (!isStaffOrAdmin) {
            if (!reservation.getCustomer().getId().equals(principal.getId())) {
                throw new ForbiddenException("You cannot modify another customer's reservation");
            }
            if (newStatus != ReservationStatus.CANCELLED) {
                throw new ForbiddenException("Customers may only cancel reservations");
            }
        }

        // Reject cancellation/expiration if financial commitment exists
        if (newStatus == ReservationStatus.CANCELLED || newStatus == ReservationStatus.EXPIRED) {
            if (hasFinancialCommitment(reservation)) {
                throw new BadRequestException("Reservation cannot be cancelled because a payment or active payment plan is associated with this reservation.");
            }
        }

        // Invalid transitions
        if ((reservation.getStatus() == ReservationStatus.CANCELLED || reservation.getStatus() == ReservationStatus.EXPIRED)
                && newStatus == ReservationStatus.CONFIRMED) {
            throw new BadRequestException("Cannot confirm an already " + reservation.getStatus().getDisplayValue() + " reservation.");
        }

        // Enforce 48-hour cancellation deadline if customer cancels a confirmed reservation
        if (newStatus == ReservationStatus.CANCELLED && reservation.getStatus() == ReservationStatus.CONFIRMED && !isStaffOrAdmin) {
            LocalDateTime deadline = reservation.getCancellationDeadline() != null
                    ? reservation.getCancellationDeadline()
                    : (reservation.getReservationFeeConfirmedAt() != null
                            ? reservation.getReservationFeeConfirmedAt().plusHours(48)
                            : null);
            if (deadline != null && getCurrentDateTime().isAfter(deadline)) {
                throw new BadRequestException("CANCELLATION_DEADLINE_EXPIRED: The 48-hour cancellation window has expired. Cancellation is not allowed.");
            }
        }

        // Set fee confirmation and hold deadlines if transitioning to CONFIRMED
        if (newStatus == ReservationStatus.CONFIRMED && reservation.getReservationFeeConfirmedAt() == null) {
            LocalDateTime confirmedAt = getCurrentDateTime();
            reservation.setReservationFeeConfirmedAt(confirmedAt);
            reservation.setExpiresAt(confirmedAt.plusDays(4));
            reservation.setCancellationDeadline(confirmedAt.plusHours(48));
        }

        reservation.setStatus(newStatus);
        Reservation saved = reservationRepository.save(reservation);

        // If cancelled or expired, release apartment if eligible and no other active reservation
        if (newStatus == ReservationStatus.CANCELLED || newStatus == ReservationStatus.EXPIRED) {
            if (reservation.getApartment() != null) {
                updateApartmentAvailabilityAfterReservationChange(reservation.getApartment().getId());
            }
        }

        // Notify customer
        String msg = switch (newStatus) {
            case CONFIRMED -> "Your reservation for " + reservation.getApartment().getTitle() + " is now CONFIRMED. Your 4-day reservation hold has started.";
            case CANCELLED -> "Your reservation for " + reservation.getApartment().getTitle() + " has been cancelled.";
            case EXPIRED -> "Your reservation for " + reservation.getApartment().getTitle() + " has expired.";
            default -> "Reservation status updated: " + newStatus.getDisplayValue();
        };

        notificationSubject.notifyObservers(new NotificationEvent(
                reservation.getCustomer(),
                NotificationType.RESERVATION,
                "Reservation Status: " + newStatus.getDisplayValue(),
                msg
        ));

        return toResponseWithCommitment(saved);
    }

    @Transactional
    public void expireOverdueReservations() {
        // Only confirmed reservations whose 4-day hold has lapsed should expire.
        // Pending reservations (awaiting reservation fee) do not start the 4-day hold.
        List<Reservation> overdue = reservationRepository.findByStatusAndExpiresAtBefore(
                ReservationStatus.CONFIRMED, getCurrentDateTime());

        for (Reservation r : overdue) {
            // Guard: Never expire reservations with active payments or payment plans
            if (hasFinancialCommitment(r)) {
                continue;
            }

            r.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(r);
            if (r.getApartment() != null) {
                updateApartmentAvailabilityAfterReservationChange(r.getApartment().getId());
            }

            notificationSubject.notifyObservers(new NotificationEvent(
                    r.getCustomer(),
                    NotificationType.RESERVATION,
                    "Reservation Hold Expired",
                    "Your 4-day reservation hold for " + (r.getApartment() != null ? r.getApartment().getTitle() : "the residence")
                            + " has expired. Our team will review any eligible fee refund settlement."
            ));
        }
    }
}
