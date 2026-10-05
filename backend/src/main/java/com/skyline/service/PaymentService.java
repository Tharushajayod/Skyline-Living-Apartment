package com.skyline.service;

import com.skyline.dto.payment.PaymentRequest;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.payment.PaymentVerificationRequest;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Payment;
import com.skyline.entity.PaymentPlan;
import com.skyline.entity.PaymentPlanItem;
import com.skyline.entity.Reservation;
import com.skyline.entity.User;
import com.skyline.entity.Sale;
import com.skyline.enums.NotificationType;
import com.skyline.enums.PaymentPlanStatus;
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
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.PaymentPlanRepository;
import com.skyline.repository.PaymentPlanItemRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.repository.ReservationRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentPlanRepository paymentPlanRepository;
    private final PaymentPlanItemRepository paymentPlanItemRepository;
    private final ReservationService reservationService;
    private final ReservationRepository reservationRepository;
    private final ApartmentService apartmentService;
    private final ApartmentRepository apartmentRepository;
    private final FileStorageService fileStorageService;
    private final NotificationSubject notificationSubject;
    private final NotificationService notificationService;
    private final SaleRepository saleRepository;

    public PaymentService(
            PaymentRepository paymentRepository,
            PaymentPlanRepository paymentPlanRepository,
            PaymentPlanItemRepository paymentPlanItemRepository,
            ReservationService reservationService,
            ReservationRepository reservationRepository,
            ApartmentService apartmentService,
            ApartmentRepository apartmentRepository,
            FileStorageService fileStorageService,
            NotificationSubject notificationSubject,
            NotificationService notificationService,
            SaleRepository saleRepository
    ) {
        this.paymentRepository = paymentRepository;
        this.paymentPlanRepository = paymentPlanRepository;
        this.paymentPlanItemRepository = paymentPlanItemRepository;
        this.reservationService = reservationService;
        this.reservationRepository = reservationRepository;
        this.apartmentService = apartmentService;
        this.apartmentRepository = apartmentRepository;
        this.fileStorageService = fileStorageService;
        this.notificationSubject = notificationSubject;
        this.notificationService = notificationService;
        this.saleRepository = saleRepository;
    }

    // =========================================================
    // GET PAYMENTS
    // =========================================================

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPayments(
            UserPrincipal principal,
            String customerParam
    ) {

        boolean isStaffOrAdmin =
                principal != null &&
                (principal.getUser().getRole() == UserRole.STAFF ||
                 principal.getUser().getRole() == UserRole.ADMIN);

        if (isStaffOrAdmin) {

            if (customerParam != null &&
                    !customerParam.trim().isEmpty()) {

                return paymentRepository
                        .findByCustomer_EmailOrderByUploadedAtDesc(
                                customerParam.trim()
                        )
                        .stream()
                        .map(PaymentResponse::fromEntity)
                        .collect(Collectors.toList());
            }

            return paymentRepository.findAllWithDetails()
                    .stream()
                    .map(PaymentResponse::fromEntity)
                    .collect(Collectors.toList());
        }

        Long customerId =
                principal != null
                        ? principal.getId()
                        : null;

        /*
         * Logged-in customer should always use the authenticated
         * customer ID. Do not trust a customer email coming from
         * the frontend for normal customer requests.
         */
        if (customerId != null) {

            return paymentRepository
                    .findByCustomerIdWithDetails(
                            customerId
                    )
                    .stream()
                    .map(PaymentResponse::fromEntity)
                    .collect(Collectors.toList());
        }

        return List.of();
    }

    // =========================================================
    // GET PAYMENT BY ID
    // =========================================================

    public PaymentResponse getPaymentById(Long id) {

        return paymentRepository.findById(id)
                .map(PaymentResponse::fromEntity)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Payment not found with id: " + id
                        )
                );
    }

    // =========================================================
    // CREATE ACTUAL PAYMENT
    // =========================================================

    @Transactional
    public PaymentResponse createPayment(
            UserPrincipal principal,
            PaymentRequest request
    ) {

        if (principal == null) {
            throw new ForbiddenException(
                    "Authentication is required"
            );
        }

        if (request == null) {
            throw new IllegalArgumentException(
                    "Payment request is required"
            );
        }

        if (request.getType() == null) {
            throw new IllegalArgumentException(
                    "Payment type is required"
            );
        }

        if (request.getAmount() == null ||
                request.getAmount()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Payment amount must be greater than zero"
            );
        }

        Reservation reservation = null;
        Apartment apartment = null;
        PaymentPlan paymentPlan = null;
        PaymentPlanItem paymentPlanItem = null;

        User customer = principal.getUser();

        // =====================================================
        // GET PAYMENT PLAN ITEM (IF PROVIDED)
        // =====================================================

        if (request.getPaymentPlanItemId() != null &&
                !request.getPaymentPlanItemId().trim().isEmpty()) {

            Long itemId = IdParser.parseId(request.getPaymentPlanItemId());

            paymentPlanItem = paymentPlanItemRepository.findById(itemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment plan item not found"));

            if (paymentPlanItem.getStatus() == PaymentPlanItemStatus.PAID) {
                throw new IllegalStateException("This scheduled payment has already been paid");
            }

            if (paymentPlanItem.getStatus() == PaymentPlanItemStatus.PENDING_VERIFICATION) {
                throw new IllegalStateException("This scheduled payment is already pending verification");
            }

            paymentPlan = paymentPlanItem.getPaymentPlan();
            if (paymentPlan != null) {
                if (reservation == null && paymentPlan.getReservation() != null) {
                    reservation = paymentPlan.getReservation();
                }
                if (apartment == null && paymentPlan.getApartment() != null) {
                    apartment = paymentPlan.getApartment();
                }
                if (customer == null && paymentPlan.getCustomer() != null) {
                    customer = paymentPlan.getCustomer();
                }

                // Enforce sequential payment order: all previous sequence items must be PAID
                if (paymentPlanItem.getSequenceNo() != null) {
                    List<PaymentPlanItem> allItems = paymentPlanItemRepository
                            .findByPaymentPlanIdOrderBySequenceNoAsc(paymentPlan.getId());
                    for (PaymentPlanItem prior : allItems) {
                        if (prior.getSequenceNo() < paymentPlanItem.getSequenceNo()) {
                            if (prior.getStatus() != PaymentPlanItemStatus.PAID) {
                                throw new IllegalStateException(
                                        "Installments must be paid in sequence. Payment #" +
                                        prior.getSequenceNo() + " must be paid and verified before Payment #" +
                                        paymentPlanItem.getSequenceNo() + "."
                                );
                            }
                        }
                    }
                }
            }
        }

        // =====================================================
        // GET PAYMENT PLAN (IF PROVIDED AND NOT YET RESOLVED)
        // =====================================================

        if (paymentPlan == null && request.getPaymentPlanId() != null &&
                !request.getPaymentPlanId().trim().isEmpty()) {

            Long planId = IdParser.parseId(request.getPaymentPlanId());
            paymentPlan = paymentPlanRepository.findById(planId)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment plan not found"));

            if (reservation == null && paymentPlan.getReservation() != null) {
                reservation = paymentPlan.getReservation();
            }
            if (apartment == null && paymentPlan.getApartment() != null) {
                apartment = paymentPlan.getApartment();
            }
            if (customer == null && paymentPlan.getCustomer() != null) {
                customer = paymentPlan.getCustomer();
            }
        }

        // =====================================================
        // GET RESERVATION
        // =====================================================

        if (request.getReservationId() != null &&
                !request.getReservationId()
                        .trim()
                        .isEmpty()) {

            Long reservationId =
                    IdParser.parseId(
                            request.getReservationId()
                    );

            reservation =
                    reservationService
                            .getReservationEntityById(
                                    reservationId
                            );

            apartment =
                    reservation.getApartment();

            customer =
                    reservation.getCustomer();
        }

        // =====================================================
        // GET APARTMENT
        // =====================================================

        else if (request.getApartmentId() != null &&
                !request.getApartmentId()
                        .trim()
                        .isEmpty()) {

            Long apartmentId =
                    IdParser.parseId(
                            request.getApartmentId()
                    );

            apartment =
                    apartmentService
                            .getApartmentEntityById(
                                    apartmentId
                            );
        }

        if (apartment == null && reservation != null) {
            apartment = reservation.getApartment();
        }

        if (apartment == null) {
            throw new ResourceNotFoundException(
                    "Reservation or apartment is required"
            );
        }

        if (request.getType() == PaymentType.RESERVATION_FEE && apartment.getStatus() == ApartmentStatus.SOLD) {
            throw new BadRequestException("Cannot make payment for a sold apartment");
        }

        // Enforce that reservation deposit must be verified before allowing balance or payment plan payments
        if (request.getType() != PaymentType.RESERVATION_FEE) {
            if (reservation == null) {
                throw new BadRequestException("Reservation is required for balance settlement or payment plans.");
            }

            boolean reservationFeeApproved = paymentRepository.existsByReservationIdAndTypeAndStatus(
                    reservation.getId(),
                    PaymentType.RESERVATION_FEE,
                    PaymentStatus.VERIFIED
            ) || reservation.getStatus() == ReservationStatus.CONFIRMED;

            if (!reservationFeeApproved) {
                throw new BadRequestException("Payment options will be available after your reservation payment is approved.");
            }
        }

        // =====================================================
        // OWNERSHIP VALIDATION
        // =====================================================

        boolean staffOrAdmin =
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN;

        if (!staffOrAdmin &&
                customer != null &&
                !customer.getId()
                        .equals(principal.getId())) {

            throw new ForbiddenException(
                    "You cannot make a payment for another customer"
            );
        }

        // =====================================================
        // CALCULATE REAL APARTMENT BALANCE
        // =====================================================
        //
        // IMPORTANT FIX:
        //
        // Do NOT calculate this using reservation_id.
        //
        // Some existing payments have:
        //
        // reservation_id = NULL
        // apartment_id   = valid apartment
        //
        // Those payments still belong to the apartment and must
        // reduce the apartment balance.
        //
        // Therefore ALL VERIFIED payments belonging to this
        // apartment are included.
        // =====================================================

        BigDecimal totalPrice =
                apartment.getPrice();

        if (totalPrice == null) {
            throw new IllegalStateException(
                    "Apartment price is not configured"
            );
        }

        BigDecimal verifiedPaid =
                getVerifiedApartmentTotal(
                        apartment.getId()
                );

        BigDecimal remaining =
                totalPrice.subtract(
                        verifiedPaid
                );

        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalStateException(
                    "This apartment has already been fully paid"
            );
        }

        // =====================================================
        // RESERVATION FEE
        // =====================================================

        if (request.getType()
                == PaymentType.RESERVATION_FEE) {

            if (reservation == null) {

                throw new IllegalArgumentException(
                        "Reservation is required for reservation fee payment"
                );
            }

            boolean alreadyVerified =
                    paymentRepository
                            .existsByReservationIdAndTypeAndStatus(
                                    reservation.getId(),
                                    PaymentType.RESERVATION_FEE,
                                    PaymentStatus.VERIFIED
                            );

            if (alreadyVerified) {

                throw new IllegalStateException(
                        "Reservation fee has already been verified"
                );
            }

            BigDecimal requiredFee =
                    apartment.getPrice()
                            .multiply(
                                    new BigDecimal("0.10")
                            )
                            .setScale(
                                    2,
                                    java.math.RoundingMode.HALF_UP
                            );

            if (request.getAmount()
                    .compareTo(requiredFee) != 0) {

                throw new IllegalArgumentException(
                        "Reservation fee must be exactly 10% of the apartment price: "
                                + requiredFee
                );
            }
        }

        // =====================================================
        // FULL PAYMENT
        // =====================================================

        else if (request.getType()
                == PaymentType.FULL_PAYMENT) {

            if (reservation == null) {

                throw new IllegalArgumentException(
                        "Reservation is required for full settlement"
                );
            }

            /*
             * Full payment must equal the ACTUAL apartment
             * remaining balance.
             *
             * Remaining:
             *
             * apartment price
             *      -
             * all VERIFIED apartment payments
             */
            if (request.getAmount()
                    .compareTo(remaining) != 0) {

                throw new IllegalArgumentException(
                        "Full payment must equal the current remaining balance: "
                                + remaining
                );
            }

            /*
             * If an approved installment / part payment plan
             * already exists, customer cannot switch directly
             * to full settlement.
             */
            boolean hasApprovedPlan =
                    paymentPlanRepository
                            .findFirstByReservationIdAndStatusOrderByCreatedAtDesc(
                                    reservation.getId(),
                                    PaymentPlanStatus.APPROVED
                            )
                            .isPresent();

            if (hasApprovedPlan) {

                throw new IllegalStateException(
                        "This reservation already has an approved payment plan"
                );
            }
        }

        // =====================================================
        // INSTALLMENT / PART PAYMENT
        // =====================================================

        else if (
                request.getType()
                        == PaymentType.INSTALLMENT_PAYMENT ||
                request.getType()
                        == PaymentType.PART_PAYMENT
        ) {

            if (reservation == null) {

                throw new IllegalArgumentException(
                        "Reservation is required for payment plan payments"
                );
            }

            if (paymentPlan == null) {
                if (request.getPaymentPlanId() == null ||
                        request.getPaymentPlanId()
                                .trim()
                                .isEmpty()) {

                    throw new IllegalArgumentException(
                            "Approved payment plan is required"
                    );
                }

                Long planId =
                        IdParser.parseId(
                                request.getPaymentPlanId()
                        );

                paymentPlan =
                        paymentPlanRepository
                                .findById(planId)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "Payment plan not found"
                                        )
                                );
            }

            if (paymentPlan.getStatus()
                    != PaymentPlanStatus.APPROVED) {

                throw new IllegalStateException(
                        "Payment plan is not approved"
                );
            }

            if (paymentPlanItem != null &&
                    (paymentPlanItem.getPaymentPlan() == null ||
                     !paymentPlanItem.getPaymentPlan().getId().equals(paymentPlan.getId()))) {

                throw new IllegalArgumentException(
                        "Payment plan item does not belong to this payment plan"
                );
            }

            if (paymentPlan.getReservation() == null ||
                    !paymentPlan
                            .getReservation()
                            .getId()
                            .equals(reservation.getId())) {

                throw new IllegalArgumentException(
                        "Payment plan does not belong to this reservation"
                );
            }

            if (paymentPlan.getCustomer() == null ||
                    customer == null ||
                    !paymentPlan
                            .getCustomer()
                            .getId()
                            .equals(customer.getId())) {

                throw new ForbiddenException(
                        "Payment plan does not belong to this customer"
                );
            }

            BigDecimal planRemaining =
                    paymentPlan.getRemainingAmount();

            if (planRemaining == null ||
                    planRemaining
                            .compareTo(BigDecimal.ZERO) <= 0) {

                throw new IllegalStateException(
                        "This payment plan has already been completed"
                );
            }

            /*
             * Prevent paying more than payment-plan balance.
             */
            if (request.getAmount()
                    .compareTo(planRemaining) > 0) {

                throw new IllegalArgumentException(
                        "Payment exceeds the remaining plan balance"
                );
            }

            BigDecimal normalPayment =
                    paymentPlan.getPaymentAmount();

            if (normalPayment == null ||
                    normalPayment
                            .compareTo(BigDecimal.ZERO) <= 0) {

                throw new IllegalStateException(
                        "Payment plan amount is invalid"
                );
            }

            /*
             * If paying a specific scheduled installment item:
             * match the exact scheduled item amount.
             *
             * Otherwise:
             * Normal installment / part: exact approved amount.
             * Final payment: exact remaining plan balance.
             */
            if (paymentPlanItem != null) {

                if (request.getAmount()
                        .compareTo(paymentPlanItem.getAmount()) != 0) {

                    throw new IllegalArgumentException(
                            "Payment must equal the scheduled installment amount: "
                                    + paymentPlanItem.getAmount()
                    );
                }

            } else if (planRemaining
                    .compareTo(normalPayment) > 0) {

                if (request.getAmount()
                        .compareTo(normalPayment) != 0) {

                    throw new IllegalArgumentException(
                            "Payment must equal the approved payment amount: "
                                    + normalPayment
                    );
                }

            } else {

                if (request.getAmount()
                        .compareTo(planRemaining) != 0) {

                    throw new IllegalArgumentException(
                            "Final payment must equal the remaining balance: "
                                    + planRemaining
                    );
                }
            }
        }

        // =====================================================
        // UNSUPPORTED TYPE
        // =====================================================

        else {

            throw new IllegalArgumentException(
                    "Unsupported payment type"
            );
        }

        // =====================================================
        // PREVENT APARTMENT OVERPAYMENT
        // =====================================================

        if (request.getAmount()
                .compareTo(remaining) > 0) {

            throw new IllegalArgumentException(
                    "Payment amount exceeds the apartment remaining balance. Remaining balance: "
                            + remaining
            );
        }

        // =====================================================
        // CREATE PAYMENT
        // =====================================================

        Payment payment =
                Payment.builder()

                        .reservation(
                                reservation
                        )

                        .customer(
                                customer
                        )

                        .apartment(
                                apartment
                        )

                        .paymentPlan(
                                paymentPlan
                        )

                        .paymentPlanItem(
                                paymentPlanItem
                        )

                        .customerName(
                                customer != null
                                        ? customer.getName()
                                        : ""
                        )

                        .apartmentTitle(
                                apartment.getTitle()
                        )

                        .type(
                                request.getType()
                        )

                        .amount(
                                request.getAmount()
                        )

                        .status(
                                PaymentStatus.PENDING
                        )

                        .notes(
                                request.getNotes() != null
                                        ? request.getNotes()
                                        : ""
                        )

                        .uploadedAt(
                                LocalDateTime.now()
                        )

                        .build();

        Payment saved =
                paymentRepository.save(
                        payment
                );

        if (paymentPlanItem != null) {

            paymentPlanItem.setStatus(
                    PaymentPlanItemStatus.PENDING_VERIFICATION
            );

            paymentPlanItemRepository.save(
                    paymentPlanItem
            );
        }

        notificationSubject.notifyObservers(new NotificationEvent(
                customer,
                NotificationType.PAYMENT,
                "Payment Submitted",
                "Your payment of Rs. "
                        + request.getAmount()
                        + " for "
                        + apartment.getTitle()
                        + " (" + request.getType().getDisplayValue() + ") has been submitted."
        ));

        notificationService.notifyStaffAndAdmins(
                NotificationType.PAYMENT,
                "New Payment Submitted",
                "Customer " + (customer != null ? customer.getName() : "A customer") +
                        " submitted a payment of Rs. " + request.getAmount() +
                        " for " + apartment.getTitle() + " (" + request.getType().getDisplayValue() + "). Please verify."
        );

        return PaymentResponse.fromEntity(
                saved
        );
    }

    // =========================================================
    // UPLOAD PROOF
    // =========================================================

    @Transactional
    public PaymentResponse uploadProof(
            Long id,
            MultipartFile file,
            UserPrincipal principal
    ) {

        if (principal == null) {

            throw new ForbiddenException(
                    "Authentication is required"
            );
        }

        Payment payment =
                paymentRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Payment not found with id: " + id
                                )
                        );

        boolean isStaffOrAdmin =
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN;

        if (!isStaffOrAdmin) {

            if (payment.getCustomer() == null ||
                    !payment
                            .getCustomer()
                            .getId()
                            .equals(principal.getId())) {

                throw new ForbiddenException(
                        "You cannot upload proof for another customer's payment"
                );
            }
        }

        if (payment.getStatus()
                == PaymentStatus.VERIFIED) {

            throw new IllegalStateException(
                    "Verified payment proof cannot be changed"
            );
        }

        if (file == null ||
                file.isEmpty()) {

            throw new IllegalArgumentException(
                    "Payment proof file is required"
            );
        }

        String fileUrl =
                fileStorageService
                        .storeFile(file);

        payment.setProofUrl(
                fileUrl
        );

        payment.setUploadedAt(
                LocalDateTime.now()
        );

        payment.setStatus(
                PaymentStatus.PENDING
        );

        Payment saved =
                paymentRepository.save(
                        payment
                );

        notificationSubject.notifyObservers(new NotificationEvent(
                payment.getCustomer(),
                NotificationType.PAYMENT,
                "Payment Proof Uploaded",
                "Your proof of payment for "
                        + payment.getApartmentTitle()
                        + " has been uploaded and is pending verification."
        ));

        notificationService.notifyStaffAndAdmins(
                NotificationType.PAYMENT,
                "Payment Proof Deposited",
                "Customer " + (payment.getCustomer() != null ? payment.getCustomer().getName() : "A customer") +
                        " uploaded a bank slip for " + payment.getApartmentTitle() +
                        " (Rs. " + payment.getAmount() + "). Please review and verify."
        );

        return PaymentResponse.fromEntity(
                saved
        );
    }

    // =========================================================
    // VERIFY PAYMENT
    // =========================================================

    @Transactional
    public PaymentResponse verifyPayment(
            Long id,
            PaymentVerificationRequest request,
            UserPrincipal principal
    ) {

        Payment payment =
                paymentRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Payment not found with id: " + id
                                )
                        );

        if (payment.getStatus()
                == PaymentStatus.VERIFIED) {

            throw new IllegalStateException(
                    "Payment has already been verified"
            );
        }

        if (payment.getProofUrl() == null ||
                payment.getProofUrl()
                        .trim()
                        .isEmpty()) {

            throw new IllegalStateException(
                    "Payment cannot be verified without payment proof"
            );
        }

        String verifierName =
                principal != null
                        ? principal.getName()
                        : "Staff Member";

        if (request != null &&
                request.getVerifiedBy() != null &&
                !request.getVerifiedBy()
                        .trim()
                        .isEmpty()) {

            verifierName =
                    request.getVerifiedBy()
                            .trim();
        }

        payment.setStatus(
                PaymentStatus.VERIFIED
        );

        payment.setVerifiedAt(
                LocalDateTime.now()
        );

        payment.setVerifiedBy(
                verifierName
        );

        if (request != null &&
                request.getNotes() != null) {

            payment.setNotes(
                    request.getNotes()
            );
        }

        payment.setReceiptUrl(
                "/api/payments/"
                        + payment.getId()
                        + "/receipt"
        );

        Payment saved =
                paymentRepository.save(
                        payment
                );

        // =====================================================
        // RESERVATION FEE VERIFIED
        // =====================================================

        if (payment.getType()
                == PaymentType.RESERVATION_FEE &&
                payment.getReservation() != null) {

            Reservation reservation =
                    payment.getReservation();

            reservation.setStatus(
                    ReservationStatus.CONFIRMED
            );

            reservationRepository.save(
                    reservation
            );
        }

        // =====================================================
        // INSTALLMENT / PART PAYMENT VERIFIED
        // =====================================================

        if (payment.getPaymentPlan() != null) {

            PaymentPlan plan =
                    payment.getPaymentPlan();

            BigDecimal currentPlanRemaining =
                    plan.getRemainingAmount() != null
                            ? plan.getRemainingAmount()
                            : BigDecimal.ZERO;

            BigDecimal newPlanRemaining =
                    currentPlanRemaining.subtract(
                            payment.getAmount()
                    );

            if (newPlanRemaining
                    .compareTo(BigDecimal.ZERO) < 0) {

                newPlanRemaining =
                        BigDecimal.ZERO;
            }

            plan.setRemainingAmount(
                    newPlanRemaining
            );

            if (newPlanRemaining
                    .compareTo(BigDecimal.ZERO) == 0) {

                plan.setStatus(
                        PaymentPlanStatus.COMPLETED
                );
            }

            paymentPlanRepository.save(
                    plan
            );

            if (payment.getPaymentPlanItem() != null) {

                PaymentPlanItem item =
                        payment.getPaymentPlanItem();

                item.setStatus(
                        PaymentPlanItemStatus.PAID
                );

                paymentPlanItemRepository.save(
                        item
                );
            }
        }

        // =====================================================
        // CALCULATE REAL APARTMENT BALANCE AFTER VERIFICATION
        // =====================================================
        //
        // Again, use apartment_id instead of reservation_id.
        // =====================================================

        Apartment apartment =
                payment.getApartment();

        if (apartment == null) {

            throw new IllegalStateException(
                    "Payment does not have an apartment"
            );
        }

        BigDecimal totalVerified =
                getVerifiedApartmentTotal(
                        apartment.getId()
                );

        BigDecimal apartmentRemaining =
                apartment.getPrice()
                        .subtract(
                                totalVerified
                        );

        // =====================================================
        // MARK APARTMENT AS SOLD
        // =====================================================
        //
        // FULL_PAYMENT -> SOLD
        //
        // Or if total verified payments have reached the
        // apartment price -> SOLD
        // =====================================================

        if (payment.getType()
                        == PaymentType.FULL_PAYMENT ||
                apartmentRemaining
                        .compareTo(BigDecimal.ZERO) <= 0) {

            apartment.setStatus(
                    ApartmentStatus.SOLD
            );

            apartmentRepository.save(
                    apartment
            );

            // Automatically record Sale and Ownership Record if not already created
            if (saleRepository.findByApartmentId(apartment.getId()).isEmpty()) {
                User customer = payment.getCustomer();
                if (customer == null && payment.getReservation() != null) {
                    customer = payment.getReservation().getCustomer();
                }

                Sale sale = Sale.builder()
                        .apartment(apartment)
                        .customer(customer)
                        .customerName(customer != null ? customer.getName() : "Customer")
                        .customerEmail(customer != null ? customer.getEmail() : "")
                        .apartmentTitle(apartment.getTitle())
                        .finalPrice(apartment.getPrice())
                        .reservation(payment.getReservation())
                        .saleDate(java.time.LocalDate.now())
                        .ownershipDate(java.time.LocalDate.now())
                        .ownershipStatus("Deed Transferred")
                        .staff(principal != null ? principal.getUser() : null)
                        .staffName(verifierName)
                        .createdAt(LocalDateTime.now())
                        .build();

                saleRepository.save(sale);
            }
        }

        notificationSubject.notifyObservers(new NotificationEvent(
                payment.getCustomer(),
                NotificationType.PAYMENT,
                "Payment Approved & Verified!",
                "Your payment of Rs. "
                        + payment.getAmount()
                        + " for "
                        + payment.getApartmentTitle()
                        + " has been approved and verified. Official receipt is now available."
        ));

        return PaymentResponse.fromEntity(
                saved
        );
    }

    // =========================================================
    // REJECT PAYMENT
    // =========================================================

    @Transactional
    public PaymentResponse rejectPayment(
            Long id,
            PaymentVerificationRequest request,
            UserPrincipal principal
    ) {

        Payment payment =
                paymentRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Payment not found with id: " + id
                                )
                        );

        if (payment.getStatus()
                == PaymentStatus.VERIFIED) {

            throw new IllegalStateException(
                    "Verified payments cannot be rejected"
            );
        }

        String verifierName =
                principal != null
                        ? principal.getName()
                        : "Staff Member";

        if (request != null &&
                request.getVerifiedBy() != null &&
                !request.getVerifiedBy()
                        .trim()
                        .isEmpty()) {

            verifierName =
                    request.getVerifiedBy()
                            .trim();
        }

        payment.setStatus(
                PaymentStatus.REJECTED
        );

        payment.setVerifiedAt(
                LocalDateTime.now()
        );

        payment.setVerifiedBy(
                verifierName
        );

        if (request != null &&
                request.getNotes() != null) {

            payment.setNotes(
                    request.getNotes()
            );
        }

        Payment saved =
                paymentRepository.save(
                        payment
                );

        /*
         * If payment belongs to a payment-plan schedule item,
         * make it available for payment again.
         */
        if (payment.getPaymentPlanItem() != null) {

            PaymentPlanItem item =
                    payment.getPaymentPlanItem();

            item.setStatus(
                    PaymentPlanItemStatus.UPCOMING
            );

            paymentPlanItemRepository.save(
                    item
            );
        }

        notificationSubject.notifyObservers(new NotificationEvent(
                payment.getCustomer(),
                NotificationType.PAYMENT,
                "Payment Rejected",
                "Your payment proof for "
                        + payment.getApartmentTitle()
                        + " was rejected. "
                        + (
                        payment.getNotes() != null
                                ? payment.getNotes()
                                : ""
                )
        ));

        return PaymentResponse.fromEntity(
                saved
        );
    }

    // =========================================================
    // HELPER - VERIFIED APARTMENT TOTAL
    // =========================================================
    //
    // This is the important helper for remaining balance.
    //
    // We deliberately use apartment_id instead of
    // reservation_id.
    // =========================================================

    private BigDecimal getVerifiedApartmentTotal(
            Long apartmentId
    ) {

        BigDecimal total =
                paymentRepository
                        .sumAmountByApartmentAndStatus(
                                apartmentId,
                                PaymentStatus.VERIFIED
                        );

        return total != null
                ? total
                : BigDecimal.ZERO;
    }
}