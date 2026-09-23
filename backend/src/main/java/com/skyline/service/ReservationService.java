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
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.AppointmentRepository;
import com.skyline.repository.OwnershipRecordRepository;
import com.skyline.repository.PaymentPlanRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.ReservationRefundRepository;
import com.skyline.repository.ReservationRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private final OwnershipRecordRepository ownershipRecordRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public ReservationService(ReservationRepository reservationRepository,
                              ApartmentRepository apartmentRepository,
                              AppointmentRepository appointmentRepository,
                              PaymentRepository paymentRepository,
                              PaymentPlanRepository paymentPlanRepository,
                              ReservationRefundRepository reservationRefundRepository,
                              SaleRepository saleRepository,
                              OwnershipRecordRepository ownershipRecordRepository,
                              UserService userService,
                              NotificationService notificationService) {
        this.reservationRepository = reservationRepository;
        this.apartmentRepository = apartmentRepository;
        this.appointmentRepository = appointmentRepository;
        this.paymentRepository = paymentRepository;
        this.paymentPlanRepository = paymentPlanRepository;
        this.reservationRefundRepository = reservationRefundRepository;
        this.saleRepository = saleRepository;
        this.ownershipRecordRepository = ownershipRecordRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    public boolean hasFinancialCommitment(Reservation reservation) {
        if (reservation == null) return false;

        // 1. Check if there is an active/approved/pending/completed payment plan
        boolean hasActivePlan = paymentPlanRepository.existsByReservationIdAndStatusIn(
                reservation.getId(),
                List.of(PaymentPlanStatus.APPROVED, PaymentPlanStatus.PENDING, PaymentPlanStatus.COMPLETED)
        );
        if (hasActivePlan) {
            return true;
        }

        // Also check by apartment ID if reservation ID is missing in older plan records
        if (reservation.getApartment() != null) {
            List<PaymentPlan> aptPlans = paymentPlanRepository.findByApartmentIdOrderByCreatedAtDesc(reservation.getApartment().getId());
            boolean hasAptPlan = aptPlans.stream().anyMatch(p ->
                    p.getStatus() == PaymentPlanStatus.APPROVED ||
                    p.getStatus() == PaymentPlanStatus.PENDING ||
                    p.getStatus() == PaymentPlanStatus.COMPLETED
            );
            if (hasAptPlan) {
                return true;
            }
        }

        // 2. Check payments linked to reservation (or apartment)
        List<Payment> payments = paymentRepository.findByReservationId(reservation.getId());
        if (payments.isEmpty() && reservation.getApartment() != null) {
            payments = paymentRepository.findByApartmentId(reservation.getApartment().getId());
        }

        for (Payment p : payments) {
            // Verified Full Payment, Part Payment, or Installment Payment
            if (p.getStatus() == PaymentStatus.VERIFIED) {
                if (p.getType() == PaymentType.FULL_PAYMENT ||
                    p.getType() == PaymentType.PART_PAYMENT ||
                    p.getType() == PaymentType.INSTALLMENT ||
                    p.getType() == PaymentType.INSTALLMENT_PAYMENT) {
                    return true;
                }
            }
            // In-progress / Pending payment for full, part, or installment
            if (p.getStatus() == PaymentStatus.PENDING) {
                if (p.getType() == PaymentType.FULL_PAYMENT ||
                    p.getType() == PaymentType.PART_PAYMENT ||
                    p.getType() == PaymentType.INSTALLMENT ||
                    p.getType() == PaymentType.INSTALLMENT_PAYMENT) {
                    return true;
                }
            }
        }

        return false;
    }

    public String getFinancialCommitmentReason(Reservation reservation) {
        if (reservation == null) return null;

        List<Payment> payments = paymentRepository.findByReservationId(reservation.getId());
        if (payments.isEmpty() && reservation.getApartment() != null) {
            payments = paymentRepository.findByApartmentId(reservation.getApartment().getId());
        }

        // 1. Check for verified full payment
        boolean hasFullPayment = payments.stream().anyMatch(p ->
                p.getStatus() == PaymentStatus.VERIFIED && p.getType() == PaymentType.FULL_PAYMENT
        );
        if (hasFullPayment) {
            return "Full Payment Verified";
        }

        // 2. Check for active payment plan
        boolean hasActivePlan = paymentPlanRepository.existsByReservationIdAndStatusIn(
                reservation.getId(),
                List.of(PaymentPlanStatus.APPROVED, PaymentPlanStatus.COMPLETED)
        );
        if (!hasActivePlan && reservation.getApartment() != null) {
            List<PaymentPlan> aptPlans = paymentPlanRepository.findByApartmentIdOrderByCreatedAtDesc(reservation.getApartment().getId());
            hasActivePlan = aptPlans.stream().anyMatch(p ->
                    p.getStatus() == PaymentPlanStatus.APPROVED || p.getStatus() == PaymentPlanStatus.COMPLETED
            );
        }
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
        boolean hasPendingPlan = paymentPlanRepository.existsByReservationIdAndStatusIn(
                reservation.getId(),
                List.of(PaymentPlanStatus.PENDING)
        );
        if (!hasPendingPlan && reservation.getApartment() != null) {
            List<PaymentPlan> aptPlans = paymentPlanRepository.findByApartmentIdOrderByCreatedAtDesc(reservation.getApartment().getId());
            hasPendingPlan = aptPlans.stream().anyMatch(p -> p.getStatus() == PaymentPlanStatus.PENDING);
        }
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
        return ReservationResponse.fromEntity(r, hasCommitment, reason);
    }

    public List<ReservationResponse> getReservations(UserPrincipal principal, String customerParam) {
        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (isStaffOrAdmin) {
            if (customerParam != null && !customerParam.trim().isEmpty()) {
                return reservationRepository.findByCustomerEmailOrderByCreatedAtDesc(customerParam.trim()).stream()
                        .map(this::toResponseWithCommitment)
                        .collect(Collectors.toList());
            }
            return reservationRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .map(this::toResponseWithCommitment)
                    .collect(Collectors.toList());
        }

        Long customerId = principal != null ? principal.getId() : null;
        if (customerId == null && customerParam != null) {
            return reservationRepository.findByCustomerEmailOrderByCreatedAtDesc(customerParam.trim()).stream()
                    .map(this::toResponseWithCommitment)
                    .collect(Collectors.toList());
        }
        if (customerId != null) {
            return reservationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                    .map(this::toResponseWithCommitment)
                    .collect(Collectors.toList());
        }
        return List.of();
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
        ReservationRefundResponse refundDto = reservationRefundRepository.findByReservationId(reservation.getId())
                .map(ReservationRefundResponse::fromEntity)
                .orElse(null);

        return ReservationDetailsResponse.builder()
                .reservation(resDto)
                .customer(custDto)
                .apartment(aptDto)
                .appointment(apptDto)
                .payment(paymentDto)
                .allPayments(allPaymentResponses)
                .refund(refundDto)
                .build();
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
        notificationService.createNotification(
                customer,
                NotificationType.RESERVATION,
                "Reservation Placed - Payment Required",
                "Your reservation for " + apartment.getTitle()
                        + " has been placed. The reservation fee is 10% of the apartment price ("
                        + fee
                        + "). Please upload the reservation fee payment proof within 96 hours to confirm."
        );

        return toResponseWithCommitment(saved);
    }

    @Transactional
    public ReservationRefundResponse cancelReservationWithRefund(Long id, ReservationCancellationRequest request, UserPrincipal principal) {
        Reservation reservation = getReservationEntityById(id);

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BadRequestException("This reservation is already cancelled.");
        }

        if (hasFinancialCommitment(reservation)) {
            throw new BadRequestException("Reservation cannot be cancelled because a payment or active payment plan is associated with this reservation.");
        }

        if (reservationRefundRepository.existsByReservationId(reservation.getId())) {
            throw new ConflictException("A refund/financial record has already been processed for this reservation.");
        }

        // Financial validation
        BigDecimal originalFee = reservation.getReservationFee();
        BigDecimal refundAmount = request.getRefundAmount();
        BigDecimal companyRetained = request.getCompanyRetainedAmount();

        validateRefundCalculation(originalFee, refundAmount, companyRetained);

        // Update reservation status
        reservation.setStatus(ReservationStatus.CANCELLED);
        Reservation savedReservation = reservationRepository.save(reservation);

        // Update apartment availability safely if eligible (unsold and no other active hold)
        if (reservation.getApartment() != null) {
            updateApartmentAvailabilityAfterReservationChange(reservation.getApartment().getId());
        }

        // Find associated payment
        Payment payment = findAssociatedReservationPayment(reservation.getId(), reservation.getApartment().getId());

        String processorName = principal != null ? principal.getUser().getName() : "Management Staff";

        ReservationRefund refundRecord = ReservationRefund.builder()
                .reservation(savedReservation)
                .customer(savedReservation.getCustomer())
                .apartment(savedReservation.getApartment())
                .payment(payment)
                .originalFee(originalFee)
                .refundAmount(refundAmount)
                .companyRetainedAmount(companyRetained)
                .refundStatus(RefundStatus.PROCESSED)
                .refundType(RefundType.CANCELLATION)
                .reason(request.getReason())
                .notes(request.getNotes())
                .processedBy(processorName)
                .processedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ReservationRefund savedRefund = reservationRefundRepository.save(refundRecord);

        // Notify customer
        notificationService.createNotification(
                reservation.getCustomer(),
                NotificationType.RESERVATION,
                "Reservation Cancelled & Refund Processed",
                "Your reservation for " + reservation.getApartment().getTitle() + " has been cancelled. Refund amount: "
                        + refundAmount + ", Company retained cancellation fee: " + companyRetained + "."
        );

        return ReservationRefundResponse.fromEntity(savedRefund);
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

        BigDecimal originalFee = reservation.getReservationFee();
        BigDecimal refundAmount = request.getRefundAmount();
        BigDecimal companyRetained = request.getCompanyRetainedAmount();

        validateRefundCalculation(originalFee, refundAmount, companyRetained);

        // Find associated payment
        Payment payment = findAssociatedReservationPayment(reservation.getId(), reservation.getApartment().getId());

        String processorName = principal != null ? principal.getUser().getName() : "Management Staff";

        ReservationRefund refundRecord = ReservationRefund.builder()
                .reservation(reservation)
                .customer(reservation.getCustomer())
                .apartment(reservation.getApartment())
                .payment(payment)
                .originalFee(originalFee)
                .refundAmount(refundAmount)
                .companyRetainedAmount(companyRetained)
                .refundStatus(RefundStatus.PROCESSED)
                .refundType(RefundType.EXPIRATION)
                .reason(request.getReason())
                .notes(request.getNotes())
                .processedBy(processorName)
                .processedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ReservationRefund savedRefund = reservationRefundRepository.save(refundRecord);

        // Notify customer
        notificationService.createNotification(
                reservation.getCustomer(),
                NotificationType.RESERVATION,
                "Expired Reservation Settlement Processed",
                "Financial settlement for your expired reservation on " + reservation.getApartment().getTitle()
                        + " has been recorded. Refund amount: " + refundAmount + ", Company retained amount: " + companyRetained + "."
        );

        return ReservationRefundResponse.fromEntity(savedRefund);
    }

    private void validateRefundCalculation(BigDecimal originalFee, BigDecimal refundAmount, BigDecimal companyRetained) {
        if (originalFee == null || originalFee.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Original reservation fee must be positive.");
        }
        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Refund amount cannot be negative.");
        }
        if (companyRetained == null || companyRetained.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Company retained amount cannot be negative.");
        }
        if (refundAmount.compareTo(originalFee) > 0) {
            throw new BadRequestException("Refund amount (" + refundAmount + ") cannot exceed original reservation fee (" + originalFee + ").");
        }
        BigDecimal sum = refundAmount.add(companyRetained);
        if (sum.compareTo(originalFee) != 0) {
            throw new BadRequestException("Refund amount (" + refundAmount + ") + Company retained amount (" + companyRetained
                    + ") must exactly equal original reservation fee (" + originalFee + ").");
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

        // 3. If an Ownership Record exists for this apartment, keep it SOLD
        if (ownershipRecordRepository.findByApartmentId(apartmentId).isPresent()) {
            return;
        }

        // 4. Verify there are no other active reservations (PENDING or CONFIRMED)
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

        notificationService.createNotification(
                reservation.getCustomer(),
                NotificationType.RESERVATION,
                "Reservation Status: " + newStatus.getDisplayValue(),
                msg
        );

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

            notificationService.createNotification(
                    r.getCustomer(),
                    NotificationType.RESERVATION,
                    "Reservation Expired",
                    "Your reservation for " + r.getApartment().getTitle() + " has expired. Our team will review any eligible fee refund settlement."
            );
        }
    }
}
