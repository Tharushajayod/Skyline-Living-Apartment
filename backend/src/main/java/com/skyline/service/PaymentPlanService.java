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
import com.skyline.enums.PaymentPlanItemStatus;
import com.skyline.enums.PaymentStatus;
import com.skyline.enums.UserRole;
import com.skyline.exception.ForbiddenException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.PaymentPlanRepository;
import com.skyline.repository.PaymentPlanItemRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentPlanService {

    private final PaymentPlanRepository paymentPlanRepository;
    private final PaymentRepository paymentRepository;
    private final ReservationService reservationService;
    private final NotificationService notificationService;
    private final ApartmentRepository apartmentRepository;
    private final PaymentPlanItemRepository paymentPlanItemRepository;

    public PaymentPlanService(
        PaymentPlanRepository paymentPlanRepository,
        PaymentRepository paymentRepository,
        ReservationService reservationService,
        NotificationService notificationService,
        ApartmentRepository apartmentRepository,
        PaymentPlanItemRepository paymentPlanItemRepository
    ) {
        this.paymentPlanRepository = paymentPlanRepository;
        this.paymentRepository = paymentRepository;
        this.reservationService = reservationService;
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

        if (paymentPlanRepository.existsByReservationIdAndStatusIn(
                reservation.getId(),
                Arrays.asList(
                        PaymentPlanStatus.PENDING,
                        PaymentPlanStatus.APPROVED
                )
        )) {

            throw new IllegalStateException(
                    "This reservation already has a pending or approved payment plan"
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
            throw new IllegalStateException(
                    "This apartment has already been fully paid"
            );
        }

        if (request.getNumberOfPayments() == null ||
                request.getNumberOfPayments() <= 0) {

            throw new IllegalArgumentException(
                    "Number of payments must be greater than zero"
            );
        }

        if (request.getPaymentAmount() == null ||
                request.getPaymentAmount()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Payment amount must be greater than zero"
            );
        }

        BigDecimal scheduledBeforeFinal = request.getPaymentAmount()
                .multiply(BigDecimal.valueOf(request.getNumberOfPayments() - 1L));

        if (scheduledBeforeFinal.compareTo(outstanding) >= 0) {
            throw new IllegalArgumentException(
                    "Payment amount is too high for the selected number of payments"
            );
        }

        BigDecimal finalPayment = outstanding.subtract(scheduledBeforeFinal);
        if (finalPayment.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Payment amount is too high for the selected number of payments"
            );
        }

        BigDecimal minAcceptable = outstanding.divide(
                BigDecimal.valueOf(request.getNumberOfPayments()),
                0,
                java.math.RoundingMode.FLOOR
        );

        if (request.getPaymentAmount().compareTo(minAcceptable) < 0) {
            throw new IllegalArgumentException(
                    "Selected payments do not cover the remaining balance"
            );
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
                        request.getPaymentAmount()
                )

                .totalPlanAmount(outstanding)

                .remainingAmount(outstanding)

                .startDate(
                        request.getStartDate() != null
                                ? request.getStartDate()
                                : LocalDate.now()
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

        notificationService.createNotification(
                customer,
                NotificationType.PAYMENT,
                "Payment Plan Request Submitted",
                "Your " +
                        request.getPlanType().getDisplayValue() +
                        " request for " +
                        apartment.getTitle() +
                        " has been submitted for approval."
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

        if (plan.getStatus() != PaymentPlanStatus.PENDING) {
            throw new IllegalStateException(
                    "Only pending payment plans can be approved"
            );
        }

        plan.setStatus(PaymentPlanStatus.APPROVED);

        plan.setApprovedBy(
                principal.getUser().getName()
        );

        plan.setApprovedAt(
                LocalDateTime.now()
        );

        // Once a payment plan is approved, the apartment is committed
        // to this customer and must not be available to anyone else.
        Apartment apartment = plan.getApartment();

        if (apartment != null) {
            apartment.setStatus(ApartmentStatus.SOLD);
            apartmentRepository.save(apartment);
        }

        if (request != null) {
            plan.setAdminNotes(request.getNotes());
        }

        PaymentPlan saved =
                paymentPlanRepository.save(plan);

        if (!paymentPlanItemRepository.existsByPaymentPlanId(saved.getId())) {

            BigDecimal normalAmount =
                    saved.getPaymentAmount();

            BigDecimal amountLeft =
                    saved.getTotalPlanAmount();

            int numberOfPayments =
                    saved.getNumberOfPayments();

            LocalDate firstDueDate =
                    saved.getStartDate();

            if (firstDueDate == null ||
                    firstDueDate.isBefore(LocalDate.now())) {

                firstDueDate =
                        LocalDate.now().plusMonths(1);
            }

            for (int i = 1; i <= numberOfPayments; i++) {

                BigDecimal itemAmount;

                if (i == numberOfPayments) {
                    itemAmount = amountLeft;
                } else {
                    itemAmount = normalAmount;
                }

                if (itemAmount.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalStateException(
                            "Invalid payment plan schedule"
                    );
                }

                PaymentPlanItem item =
                        PaymentPlanItem.builder()
                                .paymentPlan(saved)
                                .sequenceNo(i)
                                .amount(itemAmount)
                                .dueDate(
                                        firstDueDate.plusMonths(i - 1L)
                                )
                                .status(
                                        PaymentPlanItemStatus.UPCOMING
                                )
                                .build();

                paymentPlanItemRepository.save(item);

                amountLeft =
                        amountLeft.subtract(itemAmount);
            }

            if (amountLeft.compareTo(BigDecimal.ZERO) != 0) {
                throw new IllegalStateException(
                        "Payment plan amounts do not cover the outstanding balance"
                );
            }
        }

        notificationService.createNotification(
                plan.getCustomer(),
                NotificationType.PAYMENT,
                "Payment Plan Approved",
                "Your " +
                        plan.getPlanType().getDisplayValue() +
                        " for " +
                        plan.getApartment().getTitle() +
                        " has been approved."
        );

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

        if (plan.getStatus() != PaymentPlanStatus.PENDING) {
            throw new IllegalStateException(
                    "Only pending payment plans can be rejected"
            );
        }

        plan.setStatus(PaymentPlanStatus.REJECTED);

        if (request != null) {
            plan.setAdminNotes(request.getNotes());
        }

        PaymentPlan saved =
                paymentPlanRepository.save(plan);

        notificationService.createNotification(
                plan.getCustomer(),
                NotificationType.PAYMENT,
                "Payment Plan Rejected",
                "Your payment plan request for " +
                        plan.getApartment().getTitle() +
                        " was not approved."
        );

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