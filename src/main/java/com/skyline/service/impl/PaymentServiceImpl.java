package com.skyline.service.impl;

import com.skyline.dto.payment.CreatePaymentRequest;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.payment.UpdatePaymentStatusRequest;
import com.skyline.entity.Customer;
import com.skyline.entity.Payment;
import com.skyline.repository.CustomerRepository;
import com.skyline.repository.PaymentRepository;
import com.skyline.service.PaymentService;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            CustomerRepository customerRepository) {

        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
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
            UpdatePaymentStatusRequest request) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Payment not found with ID: " + paymentId
                ));

        String newStatus = request.getPaymentStatus();

        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException(
                    "Payment status cannot be empty"
            );
        }

        newStatus = newStatus.trim().toUpperCase();

        if (!isValidPaymentStatus(newStatus)) {
            throw new IllegalArgumentException(
                    "Invalid payment status. Allowed values are " +
                    "PENDING, PAID, PARTIALLY_PAID and REJECTED"
            );
        }

        if ("REJECTED".equals(newStatus)
                && (request.getRejectionReason() == null
                || request.getRejectionReason().isBlank())) {

            throw new IllegalArgumentException(
                    "Rejection reason is required when rejecting a payment"
            );
        }

        payment.setPaymentStatus(newStatus);

        if ("PAID".equals(newStatus)) {

            payment.setPaidAmount(payment.getTotalPayableAmount());
            payment.setOutstandingAmount(BigDecimal.ZERO);
            payment.setRejectionReason(null);
            payment.setVerifiedAt(LocalDateTime.now());

        } else if ("PARTIALLY_PAID".equals(newStatus)) {

            payment.setRejectionReason(null);
            payment.setVerifiedAt(LocalDateTime.now());

        } else if ("REJECTED".equals(newStatus)) {

            payment.setRejectionReason(
                    request.getRejectionReason().trim()
            );

            payment.setVerifiedAt(LocalDateTime.now());

        } else {

            payment.setRejectionReason(null);
            payment.setVerifiedAt(null);
        }

        Payment updatedPayment = paymentRepository.save(payment);

        return mapToPaymentResponse(updatedPayment);
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

        return "PENDING".equals(status)
                || "PAID".equals(status)
                || "PARTIALLY_PAID".equals(status)
                || "REJECTED".equals(status);
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

        return response;
    }
}