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
                new com.skyline.factory.reservation.ReservationRefundFactoryImpl());
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
                              com.skyline.factory.reservation.ReservationRefundFactory reservationRefundFactory) {
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
        if (reservation.getApartment() != null && reservation.getApartment().getId() != null) {
            plans.addAll(paymentPlanRepository.findByApartmentIdOrderByCreatedAtDesc(reservation.getApartment().getId()));
        }

        List<Payment> payments = new ArrayList<>();
        if (reservation.getId() != null) {
            payments.addAll(paymentRepository.findByReservationId(reservation.getId()));
        }
        if (payments.isEmpty() && reservation.getApartment() != null && reservation.getApartment().getId() != null) {
            payments.addAll(paymentRepository.findByApartmentId(reservation.getApartment().getId()));
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
        if (reservation.getApartment() != null && reservation.getApartment().getId() != null) {
            plans.addAll(paymentPlanRepository.findByApartmentIdOrderByCreatedAtDesc(reservation.getApartment().getId()));
        }

        List<Payment> payments = new ArrayList<>();
        if (reservation.getId() != null) {
            payments.addAll(paymentRepository.findByReservationId(reservation.getId()));
        }
        if (payments.isEmpty() && reservation.getApartment() != null && reservation.getApartment().getId() != null) {
            payments.addAll(paymentRepository.findByApartmentId(reservation.getApartment().getId()));
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
        boolean hasCommitment = hasFinancialCommitment(r);
        String reason = hasCommitment ? getFinancialCommitmentReason(r) : null;

        Long aId = r.getApartment() != null ? r.getApartment().getId() : null;
        Sale sale = aId != null ? saleRepository.findByApartmentId(aId).orElse(null) : null;
        boolean isAptSold = r.getApartment() != null && r.getApartment().getStatus() == ApartmentStatus.SOLD;
        boolean hasCompletedSale = sale != null || isAptSold;

        List<Payment> payments = new ArrayList<>();
        if (r.getId() != null) payments.addAll(paymentRepository.findByReservationId(r.getId()));
        if (aId != null) payments.addAll(paymentRepository.findByApartmentId(aId));

        BigDecimal totalVerified = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED)
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal aptPrice = (r.getApartment() != null && r.getApartment().getPrice() != null)
                ? r.getApartment().getPrice() : BigDecimal.ZERO;
        boolean isFullPayment = (aptPrice.compareTo(BigDecimal.ZERO) > 0 && totalVerified.compareTo(aptPrice) >= 0)
                || payments.stream().anyMatch(p -> p.getStatus() == PaymentStatus.VERIFIED && p.getType() == PaymentType.FULL_PAYMENT);

        boolean isFullyPaid = isFullPayment || hasCompletedSale;
        String saleId = sale != null ? IdParser.formatId("SAL", sale.getId()) : null;

        BigDecimal fee = r.getReservationFee() != null ? r.getReservationFee() : BigDecimal.ZERO;
        BigDecimal nonRefundable = fee;
        BigDecimal otherPaid = totalVerified.compareTo(fee) > 0 ? totalVerified.subtract(fee) : BigDecimal.ZERO;
        BigDecimal refundable = otherPaid;

        return ReservationResponse.fromEntity(r, hasCommitment, reason, hasCompletedSale, saleId, isFullyPaid, totalVerified, otherPaid, refundable, nonRefundable);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> toResponseWithCommitmentList(List<Reservation> reservations) {
        if (reservations == null || reservations.isEmpty()) return List.of();

        Set<Long> resIds = reservations.stream().map(Reservation::getId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> aptIds = reservations.stream()
                .map(r -> r.getApartment() != null ? r.getApartment().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<PaymentPlan> allPlans = paymentPlanRepository.findByReservationIdInOrApartmentIdIn(resIds, aptIds);
        List<Payment> allPayments = paymentRepository.findByReservationIdInOrApartmentIdIn(resIds, aptIds);
        List<Sale> allSales = aptIds.isEmpty() ? List.of() : saleRepository.findByApartmentIdIn(aptIds);

        Map<Long, List<PaymentPlan>> plansByResId = allPlans.stream()
                .filter(p -> p.getReservation() != null && p.getReservation().getId() != null)
                .collect(Collectors.groupingBy(p -> p.getReservation().getId()));

        Map<Long, List<PaymentPlan>> plansByAptId = allPlans.stream()
                .filter(p -> p.getApartment() != null && p.getApartment().getId() != null)
                .collect(Collectors.groupingBy(p -> p.getApartment().getId()));

        Map<Long, List<Payment>> paymentsByResId = allPayments.stream()
                .filter(p -> p.getReservation() != null && p.getReservation().getId() != null)
                .collect(Collectors.groupingBy(p -> p.getReservation().getId()));

        Map<Long, List<Payment>> paymentsByAptId = allPayments.stream()
                .filter(p -> p.getApartment() != null && p.getApartment().getId() != null)
                .collect(Collectors.groupingBy(p -> p.getApartment().getId()));

        Map<Long, Sale> salesByAptId = allSales.stream()
                .filter(s -> s.getApartment() != null && s.getApartment().getId() != null)
                .collect(Collectors.toMap(s -> s.getApartment().getId(), s -> s, (s1, s2) -> s1));

        return reservations.stream().map(r -> {
            Long rId = r.getId();
            Long aId = r.getApartment() != null ? r.getApartment().getId() : null;

            List<PaymentPlan> relatedPlans = new ArrayList<>();
            if (rId != null && plansByResId.containsKey(rId)) relatedPlans.addAll(plansByResId.get(rId));
            if (aId != null && plansByAptId.containsKey(aId)) relatedPlans.addAll(plansByAptId.get(aId));

            List<Payment> relatedPayments = new ArrayList<>();
            if (rId != null && paymentsByResId.containsKey(rId)) relatedPayments.addAll(paymentsByResId.get(rId));
            if (aId != null && paymentsByAptId.containsKey(aId)) relatedPayments.addAll(paymentsByAptId.get(aId));

            boolean hasCommitment = hasFinancialCommitment(r, relatedPlans, relatedPayments);
            String reason = hasCommitment ? getFinancialCommitmentReason(r, relatedPlans, relatedPayments) : null;

            Sale sale = aId != null ? salesByAptId.get(aId) : null;
            Apartment apt = r.getApartment();
            boolean isAptSold = apt != null && apt.getStatus() == ApartmentStatus.SOLD;
            boolean hasCompletedSale = sale != null || isAptSold;

            BigDecimal totalVerified = relatedPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.VERIFIED)
                    .map(Payment::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal aptPrice = (apt != null && apt.getPrice() != null) ? apt.getPrice() : BigDecimal.ZERO;
            boolean isFullPayment = (aptPrice.compareTo(BigDecimal.ZERO) > 0 && totalVerified.compareTo(aptPrice) >= 0)
                    || relatedPayments.stream().anyMatch(p -> p.getStatus() == PaymentStatus.VERIFIED && p.getType() == PaymentType.FULL_PAYMENT);

            boolean isFullyPaid = isFullPayment || hasCompletedSale;
            String saleId = sale != null ? IdParser.formatId("SAL", sale.getId()) : null;

            BigDecimal fee = r.getReservationFee() != null ? r.getReservationFee() : BigDecimal.ZERO;
            BigDecimal nonRefundable = fee;
            BigDecimal otherPaid = totalVerified.compareTo(fee) > 0 ? totalVerified.subtract(fee) : BigDecimal.ZERO;
            BigDecimal refundable = otherPaid;

            return ReservationResponse.fromEntity(r, hasCommitment, reason, hasCompletedSale, saleId, isFullyPaid, totalVerified, otherPaid, refundable, nonRefundable);
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

        // Payments
        List<Payment> payments = paymentRepository.findByReservationId(reservation.getId());
        if (payments.isEmpty() && reservation.getApartment() != null) {
            payments = paymentRepository.findByApartmentId(reservation.getApartment().getId());
        }
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

        // 5. Must have verified reservation payment:
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

        // 6. Determine successful payment time:
        LocalDateTime paymentTime = primaryPayment.getVerifiedAt() != null 
                ? primaryPayment.getVerifiedAt() 
                : primaryPayment.getUploadedAt();
        if (paymentTime == null) {
            paymentTime = reservation.getCreatedAt();
        }

        LocalDateTime deadline = paymentTime.plusHours(48);
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
        Payment payment = findAssociatedReservationPayment(reservation.getId(), 
                reservation.getApartment() != null ? reservation.getApartment().getId() : null);
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
        Apartment apartment = apartmentRepository.findById(aptId)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + aptId));

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

        // Rule 2: Apartment must be AVAILABLE
        if (apartment.getStatus() != ApartmentStatus.AVAILABLE) {
            throw new ConflictException("Apartment is not available for reservation (Current status: " + apartment.getStatus().getDisplayValue() + ")");
        }

        // Rule 3: Prevent duplicate active reservations
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
                .expiresAt(LocalDateTime.now().plusDays(4))
                .createdAt(LocalDateTime.now())
                .build();

        // Apartment becomes RESERVED
        apartment.setStatus(ApartmentStatus.RESERVED);
        apartmentRepository.save(apartment);

        Reservation saved = reservationRepository.save(reservation);

        // Notify customer
        notificationSubject.notifyObservers(new NotificationEvent(
                customer,
                NotificationType.RESERVATION,
                "Reservation Placed - Payment Required",
                "Your reservation for " + apartment.getTitle()
                        + " has been placed. The reservation fee is 10% of the apartment price ("
                        + fee
                        + "). Please upload the reservation fee payment proof within 96 hours to confirm."
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
        Payment payment = findAssociatedReservationPayment(reservation.getId(), 
                reservation.getApartment() != null ? reservation.getApartment().getId() : null);

        if (payment == null || payment.getStatus() != PaymentStatus.VERIFIED) {
            throw new BadRequestException("Reservation payment was not found or has not been successfully verified.");
        }

        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BadRequestException("Only confirmed reservations with verified deposits can be cancelled with a refund.");
        }

        // 7. 48-Hour Refund Period check
        // Start timestamp is the successful reservation payment time (verifiedAt, or fallback uploadedAt)
        LocalDateTime paymentTime = payment.getVerifiedAt() != null 
                ? payment.getVerifiedAt() 
                : payment.getUploadedAt();
        if (paymentTime == null) {
            paymentTime = reservation.getCreatedAt();
        }

        LocalDateTime refundDeadline = paymentTime.plusHours(48);
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

        if (refund.getRefundStatus() == RefundStatus.PENDING_REVIEW || refund.getRefundStatus() == RefundStatus.PENDING) {
            throw new BadRequestException("This cancellation request is still pending review and must be approved before payment can be recorded.");
        }

        if (request == null || request.getRefundMethod() == null || request.getRefundMethod().trim().isEmpty()) {
            throw new BadRequestException("Refund payment method is required (e.g. Bank Transfer, Cash, Other).");
        }

        LocalDateTime now = getCurrentDateTime();
        String processorName = principal.getUser().getName();

        refund.setRefundStatus(RefundStatus.COMPLETED);
        refund.setProcessedBy(processorName);
        refund.setProcessedAt(now);
        refund.setRefundMethod(request.getRefundMethod().trim());
        refund.setTransactionReference(request.getTransactionReference() != null ? request.getTransactionReference().trim() : null);
        refund.setNotes(request.getInternalNote());
        refund.setProofUrl(request.getProofUrl());
        refund.setUpdatedAt(now);

        ReservationRefund saved = reservationRefundRepository.save(refund);

        notificationSubject.notifyObservers(new NotificationEvent(
                saved.getCustomer(),
                NotificationType.PAYMENT,
                "Refund Payment Completed",
                "Your refund of Rs. " + saved.getRefundAmount() + " has been paid via "
                        + saved.getRefundMethod() + (saved.getTransactionReference() != null ? " (Ref: " + saved.getTransactionReference() + ")" : "") + "."
        ));

        ReservationRefundResponse resp = ReservationRefundResponse.fromEntity(saved);
        resp.setMessage("Refund payment has been recorded and marked as completed.");
        return resp;
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
        if (payments.isEmpty() && reservation.getApartment() != null && reservation.getApartment().getId() != null) {
            payments = paymentRepository.findByApartmentId(reservation.getApartment().getId());
        }
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

        // Find associated payment
        Payment payment = findAssociatedReservationPayment(reservation.getId(), reservation.getApartment().getId());

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

    private Payment findAssociatedReservationPayment(Long reservationId, Long apartmentId) {
        List<Payment> payments = paymentRepository.findByReservationId(reservationId);
        if (!payments.isEmpty()) {
            return payments.stream()
                    .filter(p -> p.getType() == PaymentType.RESERVATION_FEE)
                    .findFirst()
                    .orElse(payments.get(0));
        }
        if (apartmentId != null) {
            List<Payment> aptPayments = paymentRepository.findByApartmentId(apartmentId);
            return aptPayments.stream()
                    .filter(p -> p.getType() == PaymentType.RESERVATION_FEE)
                    .findFirst()
                    .orElse(aptPayments.isEmpty() ? null : aptPayments.get(0));
        }
        return null;
    }

    @Transactional
    public void updateApartmentAvailabilityAfterReservationChange(Long apartmentId) {
        if (apartmentId == null) {
            return;
        }

        Apartment apt = apartmentRepository.findById(apartmentId).orElse(null);
        if (apt == null) {
            return;
        }

        // 1. If apartment is already SOLD, NEVER revert to AVAILABLE
        if (apt.getStatus() == ApartmentStatus.SOLD) {
            return;
        }

        // 2. If a completed Sale exists for this apartment, keep it SOLD
        if (saleRepository.findByApartmentId(apartmentId).isPresent()) {
            return;
        }

        // 3. Verify there are no other active reservations (PENDING or CONFIRMED)
        boolean hasActive = reservationRepository.existsByApartmentIdAndStatusIn(
                apartmentId,
                Arrays.asList(ReservationStatus.PENDING, ReservationStatus.CONFIRMED)
        );

        if (!hasActive) {
            apt.setStatus(ApartmentStatus.AVAILABLE);
            apartmentRepository.save(apt);
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
            case CONFIRMED -> "Your reservation for " + reservation.getApartment().getTitle() + " is now CONFIRMED.";
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
        List<Reservation> overdue = reservationRepository.findByStatusAndExpiresAtBefore(
                ReservationStatus.PENDING, LocalDateTime.now());

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
                    "Reservation Expired",
                    "Your reservation for " + r.getApartment().getTitle() + " has expired. Our team will review any eligible fee refund settlement."
            ));
        }
    }
}
