package com.skyline.service.impl;

import com.skyline.dto.payment.CreatePaymentRequest;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.payment.UpdatePaymentStatusRequest;
import com.skyline.entity.Customer;
import com.skyline.entity.Payment;
import com.skyline.repository.CustomerRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.service.PaymentService;
import com.skyline.entity.Staff;
import com.skyline.repository.StaffRepository;
import com.skyline.entity.Transaction;
import com.skyline.repository.TransactionRepository;
import com.skyline.dto.payment.PaymentDetailsResponse;
import com.skyline.dto.payment.PaymentEvidenceResponse;
import com.skyline.dto.payment.TransactionResponse;
import com.skyline.entity.PaymentEvidence;
import com.skyline.entity.User;
import com.skyline.repository.PaymentEvidenceRepository;
import com.skyline.repository.UserRepository;
import com.skyline.dto.payment.PaymentDashboardSummaryResponse;
import com.skyline.dto.payment.MonthlyRevenueResponse;
import com.skyline.dto.payment.PaymentStatusReportResponse;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Set;
import java.util.ArrayList;


@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final StaffRepository staffRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentEvidenceRepository paymentEvidenceRepository;
    private final UserRepository userRepository;

    public PaymentServiceImpl(
        PaymentRepository paymentRepository,
        CustomerRepository customerRepository,
        StaffRepository staffRepository,
        TransactionRepository transactionRepository,
        PaymentEvidenceRepository paymentEvidenceRepository,
        UserRepository userRepository
    ) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.staffRepository = staffRepository;
        this.transactionRepository = transactionRepository;
        this.paymentEvidenceRepository = paymentEvidenceRepository;
        this.userRepository = userRepository;
    }

    @Override
    public PaymentResponse createPayment(CreatePaymentRequest request) {

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Customer not found with ID: " + request.getCustomerId()
                ));

        Payment payment = new Payment();

        payment.setCustomer(customer);
        payment.setAmount(request.getAmount());
        payment.setPaymentType(request.getPaymentType());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setRemarks(request.getRemarks());
        payment.setPaymentReference(request.getPaymentReference());
        payment.setCurrency("LKR");

        /*
         * Every newly submitted payment starts as PENDING.
         * A Finance and Payment Officer can verify or reject it later.
         */
        payment.setPaymentStatus("PENDING");
        payment.setPaymentDate(LocalDateTime.now());

        /*
         * Phase 1 currently treats the submitted amount as the
         * total amount payable for this payment record.
         */
        payment.setTotalPayableAmount(request.getAmount());
        payment.setPaidAmount(BigDecimal.ZERO);
        payment.setOutstandingAmount(request.getAmount());

        Payment savedPayment = paymentRepository.save(payment);

        return mapToPaymentResponse(savedPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long paymentId) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Payment not found with ID: " + paymentId
                ));

        return mapToPaymentResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {

        return paymentRepository.findAll()
                .stream()
                .map(this::mapToPaymentResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByCustomer(Long customerId) {

        if (!customerRepository.existsById(customerId)) {
            throw new EntityNotFoundException(
                    "Customer not found with ID: " + customerId
            );
        }

        return paymentRepository.findByCustomerCustomerId(customerId)
                .stream()
                .map(this::mapToPaymentResponse)
                .toList();
    }

    @Override
    public PaymentResponse updatePaymentStatus(
            Long paymentId,
            UpdatePaymentStatusRequest request,
            String verifierEmail
    ) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Payment not found with ID: " + paymentId
                        )
                );

        Staff verifier = staffRepository
                .findByUserEmail(
                        verifierEmail.trim().toLowerCase()
                )
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Finance staff profile not found"
                        )
                );

        String newStatus = request.getPaymentStatus();

        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException(
                    "Payment status cannot be empty"
            );
        }

        newStatus = newStatus.trim().toUpperCase();

        if (!isValidPaymentStatus(newStatus)) {
            throw new IllegalArgumentException(
                    "Allowed statuses are PAID, PARTIALLY_PAID and REJECTED"
            );
        }

        if (!"PENDING".equalsIgnoreCase(payment.getPaymentStatus())) {
            throw new IllegalArgumentException(
                    "Only pending payments can be verified or rejected"
            );
        }

        if ("REJECTED".equals(newStatus)) {

            if (request.getRejectionReason() == null
                    || request.getRejectionReason().isBlank()) {

                throw new IllegalArgumentException(
                        "Rejection reason is required"
                );
            }

            payment.setPaymentStatus("REJECTED");
            payment.setRejectionReason(
                    request.getRejectionReason().trim()
            );

        } else if ("PAID".equals(newStatus)) {

            payment.setPaymentStatus("PAID");

            payment.setPaidAmount(
                    payment.getTotalPayableAmount()
            );

            payment.setOutstandingAmount(
                    BigDecimal.ZERO
            );

            payment.setRejectionReason(null);
        } else {

            payment.setPaymentStatus("PARTIALLY_PAID");
            payment.setRejectionReason(null);
        }

        payment.setVerifiedBy(verifier);
        payment.setVerifiedAt(LocalDateTime.now());

        Payment updatedPayment =
                paymentRepository.save(payment);

                if ("PAID".equals(newStatus)) {
                    createSuccessfulTransactionIfRequired(
                            updatedPayment,
                            verifier
                    );
                }

        return mapToPaymentResponse(updatedPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getMyPayments(
            String email
    ) {

        return paymentRepository
                .findByCustomerUserEmailOrderByCreatedAtDesc(
                        email.trim().toLowerCase()
                )
                .stream()
                .map(this::mapToPaymentResponse)
                .toList();
    }

    @Override
    public void deletePayment(Long paymentId) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Payment not found with ID: " + paymentId
                ));

        paymentRepository.delete(payment);
    }

    private boolean isValidPaymentStatus(String status) {
        return "PAID".equals(status)
                || "PARTIALLY_PAID".equals(status)
                || "REJECTED".equals(status);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentDetailsResponse getPaymentDetails(
            Long paymentId,
            String userEmail
    ) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Payment not found with ID: " + paymentId
                        )
                );

        User currentUser = userRepository
                .findByEmail(userEmail.trim().toLowerCase())
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "User account not found"
                        )
                );

        boolean isAdminOrFinance = currentUser.getRoles()
                .stream()
                .map(role -> role.getRoleName())
                .anyMatch(roleName ->
                        "ADMIN".equals(roleName)
                                || "FINANCE_OFFICER".equals(roleName)
                );

        boolean isPaymentOwner =
                payment.getCustomer() != null
                        && payment.getCustomer().getUser() != null
                        && payment.getCustomer()
                                .getUser()
                                .getEmail()
                                .equalsIgnoreCase(userEmail);

        if (!isAdminOrFinance && !isPaymentOwner) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not allowed to view this payment"
            );
        }

        PaymentResponse paymentResponse =
                mapToPaymentResponse(payment);

        List<PaymentEvidenceResponse> evidenceResponses =
                paymentEvidenceRepository
                        .findByPaymentPaymentIdOrderByUploadedAtDesc(
                                paymentId
                        )
                        .stream()
                        .map(this::mapEvidenceResponse)
                        .toList();

        List<TransactionResponse> transactionResponses =
                transactionRepository
                        .findByPaymentPaymentId(paymentId)
                        .stream()
                        .map(this::mapTransactionResponse)
                        .toList();

        return new PaymentDetailsResponse(
                paymentResponse,
                evidenceResponses,
                transactionResponses
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentDashboardSummaryResponse getDashboardSummary() {

        long totalPayments =
                paymentRepository.count();

        long pendingPayments =
                paymentRepository.countByPaymentStatus(
                        "PENDING"
                );

        long paidPayments =
                paymentRepository.countByPaymentStatus(
                        "PAID"
                );

        long rejectedPayments =
                paymentRepository.countByPaymentStatus(
                        "REJECTED"
                );

        long partiallyPaidPayments =
                paymentRepository.countByPaymentStatus(
                        "PARTIALLY_PAID"
                );

        BigDecimal totalRevenue =
                paymentRepository.calculateTotalRevenue();

        BigDecimal totalOutstandingAmount =
                paymentRepository
                        .calculateTotalOutstandingAmount();

        return new PaymentDashboardSummaryResponse(
                totalPayments,
                pendingPayments,
                paidPayments,
                rejectedPayments,
                partiallyPaidPayments,
                totalRevenue,
                totalOutstandingAmount
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByStatus(
            String paymentStatus
    ) {

        String normalizedStatus =
                paymentStatus.trim().toUpperCase();

        if (!List.of(
                "PENDING",
                "PAID",
                "PARTIALLY_PAID",
                "REJECTED"
        ).contains(normalizedStatus)) {

            throw new IllegalArgumentException(
                    "Invalid payment status"
            );
        }

        return paymentRepository
                .findByPaymentStatusOrderByCreatedAtDesc(
                        normalizedStatus
                )
                .stream()
                .map(this::mapToPaymentResponse)
                .toList();
    }

    @Override
    public List<MonthlyRevenueResponse> getMonthlyRevenue(
            Integer year
    ) {
    
        List<Object[]> result =
                paymentRepository.getMonthlyRevenue(year);
    
        List<MonthlyRevenueResponse> response =
                new ArrayList<>();
    
        for (Object[] row : result) {
    
            int month =
                    ((Number) row[0]).intValue();
    
            BigDecimal revenue =
                    (BigDecimal) row[1];
    
            String monthName =
                    java.time.Month
                            .of(month)
                            .name();
    
            response.add(
    
                    new MonthlyRevenueResponse(
    
                            month,
    
                            monthName,
    
                            revenue
    
                    )
            );
    
        }
    
        return response;
    
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentStatusReportResponse getPaymentStatusReport() {

        long paid = paymentRepository.countByPaymentStatus(
                "PAID"
        );

        long pending = paymentRepository.countByPaymentStatus(
                "PENDING"
        );

        long rejected = paymentRepository.countByPaymentStatus(
                "REJECTED"
        );

        long partiallyPaid = paymentRepository.countByPaymentStatus(
                "PARTIALLY_PAID"
        );

        return new PaymentStatusReportResponse(
                paid,
                pending,
                rejected,
                partiallyPaid
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getOutstandingPayments() {

        return paymentRepository
        .findByPaymentStatusInOrderByCreatedAtDesc(
                List.of(
                        "PENDING",
                        "PARTIALLY_PAID"
                )
        )
        .stream()
        .map(this::mapToPaymentResponse)
        .toList();
    }

    private PaymentResponse mapToPaymentResponse(Payment payment) {

        PaymentResponse response = new PaymentResponse();

        response.setPaymentId(payment.getPaymentId());

        if (payment.getCustomer() != null) {
            response.setCustomerId(
                    payment.getCustomer().getCustomerId()
            );
        }

        response.setAmount(payment.getAmount());
        response.setPaymentType(payment.getPaymentType());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setPaymentStatus(payment.getPaymentStatus());
        response.setPaymentDate(payment.getPaymentDate());
        response.setPaymentReference(payment.getPaymentReference());
        response.setRemarks(payment.getRemarks());

        if (payment.getVerifiedBy() != null) {

            response.setVerifiedByStaffId(
                    payment.getVerifiedBy().getStaffId()
            );

            if (payment.getVerifiedBy().getUser() != null) {
                response.setVerifiedByName(
                        payment.getVerifiedBy()
                                .getUser()
                                .getFullName()
                );
            }
        }

        response.setVerifiedAt(payment.getVerifiedAt());
        response.setRejectionReason(payment.getRejectionReason());

        return response;
    }

    private void createSuccessfulTransactionIfRequired(
        Payment payment,
        Staff processedBy
    ) {

        boolean successfulTransactionExists =
                transactionRepository
                        .existsByPaymentPaymentIdAndTransactionStatus(
                                payment.getPaymentId(),
                                "SUCCESS"
                        );

        if (successfulTransactionExists) {
            return;
        }

        String uniquePart = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 10)
                .toUpperCase();

        Transaction transaction = new Transaction();

        transaction.setPayment(payment);

        transaction.setTransactionNumber(
                "TXN-" + uniquePart
        );

        transaction.setReceiptNumber(
                "RCPT-" + uniquePart
        );

        transaction.setTransactionType("PAYMENT");
        transaction.setTransactionStatus("SUCCESS");

        transaction.setTransactionAmount(
                payment.getTotalPayableAmount()
        );

        transaction.setProcessedBy(processedBy);
        transaction.setProcessedDate(LocalDateTime.now());

        transaction.setBankReference(
                payment.getPaymentReference()
        );

        transaction.setRemarks(
                "Automatically created after payment verification"
        );

        transactionRepository.save(transaction);
    }

    private PaymentEvidenceResponse mapEvidenceResponse(
            PaymentEvidence evidence
    ) {

        return new PaymentEvidenceResponse(
                evidence.getPaymentEvidenceId(),
                evidence.getPayment().getPaymentId(),
                evidence.getFileName(),
                evidence.getFileUrl(),
                evidence.getMimeType(),
                evidence.getUploadedBy().getUserId(),
                evidence.getUploadedBy().getFullName(),
                evidence.getUploadedAt()
        );
    }

    private TransactionResponse mapTransactionResponse(
            Transaction transaction
    ) {

        TransactionResponse response =
                new TransactionResponse();

        response.setTransactionId(
                transaction.getTransactionId()
        );

        response.setPaymentId(
                transaction.getPayment().getPaymentId()
        );

        response.setTransactionNumber(
                transaction.getTransactionNumber()
        );

        response.setReceiptNumber(
                transaction.getReceiptNumber()
        );

        response.setTransactionType(
                transaction.getTransactionType()
        );

        response.setTransactionStatus(
                transaction.getTransactionStatus()
        );

        response.setTransactionAmount(
                transaction.getTransactionAmount()
        );

        response.setBankReference(
                transaction.getBankReference()
        );

        response.setGatewayReference(
                transaction.getGatewayReference()
        );

        response.setChequeNumber(
                transaction.getChequeNumber()
        );

        response.setProcessedDate(
                transaction.getProcessedDate()
        );

        return response;
    }
}