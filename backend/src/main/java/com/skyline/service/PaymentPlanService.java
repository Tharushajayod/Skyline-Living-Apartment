package com.skyline.service;

import com.skyline.dto.payment.PaymentPlanDecisionRequest;
import com.skyline.dto.payment.PaymentPlanRequest;
import com.skyline.dto.payment.PaymentPlanResponse;
import com.skyline.dto.payment.PaymentPlanItemResponse;
import com.skyline.entity.Apartment;
import com.skyline.entity.Payment;
import com.skyline.entity.PaymentPlan;
import com.skyline.entity.PaymentPlanItem;
import com.skyline.entity.Reservation;
import com.skyline.entity.User;
import com.skyline.entity.ApartmentStatus;
import com.skyline.repository.ApartmentRepository;
import com.skyline.enums.NotificationType;
import com.skyline.enums.PaymentPlanStatus;
import com.skyline.enums.PaymentPlanType;
import com.skyline.enums.PaymentPlanItemStatus;
import com.skyline.enums.PaymentStatus;
import com.skyline.enums.PaymentType;
import com.skyline.enums.ReservationStatus;
import com.skyline.enums.UserRole;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ForbiddenException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.observer.NotificationEvent;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.PaymentPlanRepository;
import com.skyline.repository.PaymentPlanItemRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class PaymentPlanService {

    private final PaymentPlanRepository paymentPlanRepository;
    private final PaymentRepository paymentRepository;
    private final ReservationService reservationService;
    private final NotificationSubject notificationSubject;
    private final NotificationService notificationService;
    private final ApartmentRepository apartmentRepository;
    private final PaymentPlanItemRepository paymentPlanItemRepository;

    public PaymentPlanService(
        PaymentPlanRepository paymentPlanRepository,
        PaymentRepository paymentRepository,
        ReservationService reservationService,
        NotificationSubject notificationSubject,
        NotificationService notificationService,
        ApartmentRepository apartmentRepository,
        PaymentPlanItemRepository paymentPlanItemRepository
    ) {
        this.paymentPlanRepository = paymentPlanRepository;
        this.paymentRepository = paymentRepository;
        this.reservationService = reservationService;
        this.notificationSubject = notificationSubject;
        this.notificationService = notificationService;
        this.apartmentRepository = apartmentRepository;
        this.paymentPlanItemRepository = paymentPlanItemRepository;
    }

    public List<PaymentPlanResponse> getPlans(
            UserPrincipal principal,
            String customerEmail
    ) {

        boolean staffOrAdmin =
                principal != null &&
                (principal.getUser().getRole() == UserRole.STAFF ||
                 principal.getUser().getRole() == UserRole.ADMIN);

        if (staffOrAdmin) {

            if (customerEmail != null &&
                    !customerEmail.trim().isEmpty()) {

                return paymentPlanRepository.findAll()
                        .stream()
                        .filter(plan ->
                                plan.getCustomer() != null &&
                                plan.getCustomer().getEmail()
                                        .equalsIgnoreCase(
                                                customerEmail.trim()
                                        )
                        )
                        .map(this::toResponse)
                        .collect(Collectors.toList());
            }

            return paymentPlanRepository.findAll()
                    .stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        if (principal == null) {
            throw new ForbiddenException(
                    "Authentication is required"
            );
        }

        return paymentPlanRepository
                .findByCustomerIdOrderByCreatedAtDesc(
                        principal.getId()
                )
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PaymentPlanResponse getPlanById(Long id) {

        PaymentPlan plan = paymentPlanRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Payment plan not found with id: " + id
                        )
                );

        return toResponse(plan);
    }

    @Transactional
    public PaymentPlanResponse createPlan(
            UserPrincipal principal,
            PaymentPlanRequest request
    ) {

        if (principal == null) {
            throw new ForbiddenException(
                    "Authentication is required"
            );
        }

        Long reservationId =
                IdParser.parseId(request.getReservationId());

        Reservation reservation =
                reservationService
                        .getReservationEntityById(reservationId);

        User customer = reservation.getCustomer();
        Apartment apartment = reservation.getApartment();

        boolean staffOrAdmin =
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN;

        if (!staffOrAdmin &&
                !customer.getId().equals(principal.getId())) {

            throw new ForbiddenException(
                    "You cannot create a payment plan for another customer"
            );
        }

        if (reservation.getStatus() == ReservationStatus.CANCELLED ||
            reservation.getStatus() == ReservationStatus.EXPIRED) {
            throw new BadRequestException("Cannot create a payment plan for a cancelled or expired reservation.");
        }

        boolean reservationFeeApproved = paymentRepository.existsByReservationIdAndTypeAndStatus(
                reservation.getId(),
                PaymentType.RESERVATION_FEE,
                PaymentStatus.VERIFIED
        ) || (reservation.getStatus() == ReservationStatus.CONFIRMED &&
              paymentRepository.existsByReservationIdAndTypeAndStatus(
                      reservation.getId(),
                      PaymentType.RESERVATION_FEE,
                      PaymentStatus.VERIFIED
              ));

        if (!reservationFeeApproved) {
            throw new BadRequestException(
                    "Payment options will be available after your reservation payment is approved."
            );
        }

        if (paymentPlanRepository.existsByReservationIdAndStatusIn(
                reservation.getId(),
                Arrays.asList(
                        PaymentPlanStatus.PENDING,
                        PaymentPlanStatus.AWAITING_CUSTOMER,
                        PaymentPlanStatus.APPROVED
                )
        )) {

            throw new BadRequestException(
                    "This reservation already has an active, pending, or proposed payment plan"
            );
        }

        BigDecimal totalPrice = apartment.getPrice();

        BigDecimal verifiedPaid =
                paymentRepository
                        .findByReservationId(reservation.getId())
                        .stream()
                        .filter(payment ->
                                payment.getStatus()
                                        == PaymentStatus.VERIFIED
                        )
                        .map(Payment::getAmount)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        BigDecimal outstanding =
                totalPrice.subtract(verifiedPaid);

        if (outstanding.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(
                    "This apartment has already been fully paid"
            );
        }

        if (request.getPlanType() == PaymentPlanType.INSTALLMENT) {
            if (request.getNumberOfPayments() == null ||
                    request.getNumberOfPayments() < 2 ||
                    request.getNumberOfPayments() > 60) {
                throw new BadRequestException(
                        "Installment plans must have between 2 and 60 installments"
                );
            }
        } else if (request.getPlanType() == PaymentPlanType.PART_PAYMENT) {
            if (request.getNumberOfPayments() == null ||
                    request.getNumberOfPayments() < 2 ||
                    request.getNumberOfPayments() > 5) {
                throw new BadRequestException(
                        "Part payment plans must have between 2 and 5 parts"
                );
            }
        } else {
            if (request.getNumberOfPayments() == null ||
                    request.getNumberOfPayments() < 2) {
                throw new BadRequestException(
                        "Number of payments must be at least 2"
                );
            }
        }

        // Authoritative backend calculation: always compute paymentAmount from outstanding balance
        BigDecimal paymentAmount = outstanding.divide(
                BigDecimal.valueOf(request.getNumberOfPayments()),
                2,
                RoundingMode.HALF_UP
        );

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Colombo"));
        if (request.getStartDate() != null && request.getStartDate().isBefore(today)) {
            throw new BadRequestException("First payment date cannot be in the past. Please select today or a future date.");
        }

        /*
         * The final payment may be smaller than the normal
         * installment/part amount, therefore we keep the
         * apartment's actual outstanding balance as the
         * plan total.
         */
        PaymentPlan plan = PaymentPlan.builder()

                .reservation(reservation)

                .customer(customer)

                .apartment(apartment)

                .planType(request.getPlanType())

                .numberOfPayments(
                        request.getNumberOfPayments()
                )

                .paymentAmount(
                        paymentAmount
                )

                .totalPlanAmount(outstanding)

                .remainingAmount(outstanding)

                .startDate(
                        request.getStartDate() != null
                                ? request.getStartDate()
                                : today
                )

                .status(PaymentPlanStatus.PENDING)

                .customerNotes(
                        request.getNotes() != null
                                ? request.getNotes()
                                : ""
                )

                .createdAt(LocalDateTime.now())

                .build();

        PaymentPlan saved =
                paymentPlanRepository.save(plan);

        notificationSubject.notifyObservers(new NotificationEvent(
                customer,
                NotificationType.PAYMENT,
                "Payment Plan Request Submitted",
                "Your " +
                        request.getPlanType().getDisplayValue() +
                        " request for " +
                        apartment.getTitle() +
                        " has been submitted for approval."
        ));

        notificationService.notifyStaffAndAdmins(
                NotificationType.PAYMENT,
                "New Payment Plan Request",
                "New payment plan request received for Apartment " + apartment.getTitle() + "."
        );

        return toResponse(saved);
    }

    @Transactional
    public PaymentPlanResponse approvePlan(
            Long id,
            PaymentPlanDecisionRequest request,
            UserPrincipal principal
    ) {

        requireStaffOrAdmin(principal);

        PaymentPlan plan =
                paymentPlanRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                         "Payment plan not found"
                                )
                        );

        if (plan.getStatus() == PaymentPlanStatus.APPROVED || plan.getStatus() == PaymentPlanStatus.COMPLETED) {
            throw new BadRequestException(
                    "This payment plan has already been accepted and its financial terms can no longer be changed."
            );
        }

        if (plan.getStatus() != PaymentPlanStatus.PENDING && plan.getStatus() != PaymentPlanStatus.AWAITING_CUSTOMER) {
            throw new BadRequestException(
                    "Only pending payment plans can be reviewed and proposed"
            );
        }

        boolean isUpdate = (plan.getStatus() == PaymentPlanStatus.AWAITING_CUSTOMER);

        BigDecimal apartmentPrice = plan.getApartment() != null && plan.getApartment().getPrice() != null
                ? plan.getApartment().getPrice()
                : BigDecimal.ZERO;

        BigDecimal verifiedPaid = plan.getReservation() != null
                ? paymentRepository.findByReservationId(plan.getReservation().getId()).stream()
                    .filter(p -> p.getStatus() == PaymentStatus.VERIFIED)
                    .map(Payment::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                : BigDecimal.ZERO;

        BigDecimal principalAmount = apartmentPrice.subtract(verifiedPaid);
        if (principalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            principalAmount = plan.getRemainingAmount() != null ? plan.getRemainingAmount() : BigDecimal.ZERO;
        }

        int numberOfPayments = plan.getNumberOfPayments();

        if (plan.getPlanType() == PaymentPlanType.INSTALLMENT) {
            BigDecimal annualInterestRate = (request != null && request.getAnnualInterestRate() != null)
                    ? request.getAnnualInterestRate()
                    : BigDecimal.ZERO;

            if (annualInterestRate.compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Annual interest rate cannot be negative");
            }

            BigDecimal durationYears = BigDecimal.valueOf(numberOfPayments)
                    .divide(BigDecimal.valueOf(12), 8, RoundingMode.HALF_UP);
            BigDecimal rateFraction = annualInterestRate
                    .divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP);
            BigDecimal interestAmount = principalAmount.multiply(rateFraction)
                    .multiply(durationYears)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalPlanAmount = principalAmount.add(interestAmount);
            BigDecimal installmentAmount = totalPlanAmount
                    .divide(BigDecimal.valueOf(numberOfPayments), 2, RoundingMode.HALF_UP);

            plan.setAnnualInterestRate(annualInterestRate);
            plan.setInterestAmount(interestAmount);
            plan.setTotalPlanAmount(totalPlanAmount);
            plan.setRemainingAmount(totalPlanAmount);
            plan.setPaymentAmount(installmentAmount);
        } else if (plan.getPlanType() == PaymentPlanType.PART_PAYMENT) {
            BigDecimal additionalAmount = (request != null && request.getAdditionalAmount() != null)
                    ? request.getAdditionalAmount()
                    : BigDecimal.ZERO;

            if (additionalAmount.compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Additional amount cannot be negative");
            }

            BigDecimal totalPlanAmount = principalAmount.add(additionalAmount);
            BigDecimal partAmount = totalPlanAmount
                    .divide(BigDecimal.valueOf(numberOfPayments), 2, RoundingMode.HALF_UP);

            plan.setAdditionalAmount(additionalAmount);
            plan.setTotalPlanAmount(totalPlanAmount);
            plan.setRemainingAmount(totalPlanAmount);
            plan.setPaymentAmount(partAmount);
        }

        plan.setStatus(PaymentPlanStatus.AWAITING_CUSTOMER);
        plan.setApprovedBy(principal.getUser().getName());
        plan.setApprovedAt(LocalDateTime.now());

        if (request != null && request.getNotes() != null) {
            plan.setAdminNotes(request.getNotes());
        }

        PaymentPlan saved = paymentPlanRepository.save(plan);

        // Delete any existing items to ensure zero duplicates
        paymentPlanItemRepository.deleteByPaymentPlanId(saved.getId());

        BigDecimal normalAmount = saved.getPaymentAmount();
        BigDecimal totalPlanAmount = saved.getTotalPlanAmount();
        BigDecimal runningTotal = BigDecimal.ZERO;

        LocalDate firstDueDate = saved.getStartDate();
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Colombo"));
        if (firstDueDate == null || firstDueDate.isBefore(today)) {
            firstDueDate = today.plusMonths(1);
        }

        for (int i = 1; i <= numberOfPayments; i++) {
            BigDecimal itemAmount;
            if (i == numberOfPayments) {
                itemAmount = totalPlanAmount.subtract(runningTotal);
            } else {
                itemAmount = normalAmount;
                runningTotal = runningTotal.add(itemAmount);
            }

            if (itemAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Invalid payment plan schedule amount: " + itemAmount);
            }

            PaymentPlanItem item = PaymentPlanItem.builder()
                    .paymentPlan(saved)
                    .sequenceNo(i)
                    .amount(itemAmount)
                    .dueDate(firstDueDate.plusMonths(i - 1L))
                    .status(PaymentPlanItemStatus.UPCOMING)
                    .build();

            paymentPlanItemRepository.save(item);
        }

        String notifTitle = isUpdate ? "Payment Plan Terms Updated" : "Payment Plan Approved";
        String notifMsg = isUpdate
                ? "Your payment plan terms have been updated. Please review and accept the new terms."
                : "Your payment plan request has been approved. Please review and accept the approved payment terms.";

        notificationSubject.notifyObservers(new NotificationEvent(
                plan.getCustomer(),
                NotificationType.PAYMENT,
                notifTitle,
                notifMsg
        ));

        return toResponse(saved);
    }

    @Transactional
    public PaymentPlanResponse customerAcceptPlan(
            Long id,
            UserPrincipal principal
    ) {

        if (principal == null) {
            throw new ForbiddenException("Authentication is required");
        }

        PaymentPlan plan = paymentPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment plan not found"));

        boolean staffOrAdmin = principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN;

        if (!staffOrAdmin && !plan.getCustomer().getId().equals(principal.getId())) {
            throw new ForbiddenException("You cannot accept a payment plan for another customer");
        }

        if (plan.getStatus() != PaymentPlanStatus.AWAITING_CUSTOMER) {
            throw new IllegalStateException("Only payment plans awaiting customer confirmation can be accepted");
        }

        plan.setStatus(PaymentPlanStatus.APPROVED);

        Apartment apartment = plan.getApartment();
        if (apartment != null) {
            apartment.setStatus(ApartmentStatus.SOLD);
            apartmentRepository.save(apartment);
        }

        PaymentPlan saved = paymentPlanRepository.save(plan);

        notificationSubject.notifyObservers(new NotificationEvent(
                plan.getCustomer(),
                NotificationType.PAYMENT,
                "Payment Plan Confirmed",
                "Your payment plan for " + plan.getApartment().getTitle() + " has been confirmed and is now active."
        ));

        notificationService.notifyStaffAndAdmins(
                NotificationType.PAYMENT,
                "Payment Plan Accepted",
                "Customer " + (plan.getCustomer() != null ? plan.getCustomer().getName() : "Customer") +
                        " has accepted the payment plan terms for Apartment " + (plan.getApartment() != null ? plan.getApartment().getTitle() : "") + "."
        );

        return toResponse(saved);
    }

    @Transactional
    public PaymentPlanResponse customerDeclinePlan(
            Long id,
            UserPrincipal principal
    ) {

        if (principal == null) {
            throw new ForbiddenException("Authentication is required");
        }

        PaymentPlan plan = paymentPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment plan not found"));

        boolean staffOrAdmin = principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN;

        if (!staffOrAdmin && !plan.getCustomer().getId().equals(principal.getId())) {
            throw new ForbiddenException("You cannot decline a payment plan for another customer");
        }

        if (plan.getStatus() != PaymentPlanStatus.AWAITING_CUSTOMER) {
            throw new IllegalStateException("Only payment plans awaiting customer confirmation can be declined");
        }

        plan.setStatus(PaymentPlanStatus.REJECTED);
        paymentPlanItemRepository.deleteByPaymentPlanId(plan.getId());

        PaymentPlan saved = paymentPlanRepository.save(plan);

        notificationSubject.notifyObservers(new NotificationEvent(
                plan.getCustomer(),
                NotificationType.PAYMENT,
                "Payment Plan Declined",
                "You have declined the proposed payment plan terms for " + plan.getApartment().getTitle() + "."
        ));

        return toResponse(saved);
    }

    @Transactional
    public PaymentPlanResponse rejectPlan(
            Long id,
            PaymentPlanDecisionRequest request,
            UserPrincipal principal
    ) {

        requireStaffOrAdmin(principal);

        PaymentPlan plan =
                paymentPlanRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Payment plan not found"
                                )
                        );

        if (plan.getStatus() == PaymentPlanStatus.APPROVED || plan.getStatus() == PaymentPlanStatus.COMPLETED) {
            throw new BadRequestException(
                    "This payment plan has already been accepted and cannot be rejected."
            );
        }

        if (plan.getStatus() != PaymentPlanStatus.PENDING && plan.getStatus() != PaymentPlanStatus.AWAITING_CUSTOMER) {
            throw new BadRequestException(
                    "Only pending or proposed payment plans can be rejected"
            );
        }

        plan.setStatus(PaymentPlanStatus.REJECTED);
        paymentPlanItemRepository.deleteByPaymentPlanId(plan.getId());

        if (request != null) {
            plan.setAdminNotes(request.getNotes());
        }

        PaymentPlan saved =
                paymentPlanRepository.save(plan);

        notificationSubject.notifyObservers(new NotificationEvent(
                plan.getCustomer(),
                NotificationType.PAYMENT,
                "Payment Plan Rejected",
                "Your payment plan request has been rejected. Please review the payment plan details."
        ));

        return toResponse(saved);
    }

    private void requireStaffOrAdmin(
            UserPrincipal principal
    ) {

        if (principal == null ||
                (principal.getUser().getRole() != UserRole.STAFF &&
                 principal.getUser().getRole() != UserRole.ADMIN)) {

            throw new ForbiddenException(
                    "Staff or administrator access is required"
            );
        }
    }

    private PaymentPlanResponse toResponse(PaymentPlan plan) {

        PaymentPlanResponse response =
                PaymentPlanResponse.fromEntity(plan);

        List<PaymentPlanItemResponse> items =
                paymentPlanItemRepository
                        .findByPaymentPlanIdOrderBySequenceNoAsc(
                                plan.getId()
                        )
                        .stream()
                        .map(PaymentPlanItemResponse::fromEntity)
                        .collect(Collectors.toList());

        response.setItems(items);

        return response;
    }
}