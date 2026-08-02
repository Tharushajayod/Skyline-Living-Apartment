package com.skyline.service;

import java.util.List;

import com.skyline.dto.payment.CreatePaymentRequest;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.payment.UpdatePaymentStatusRequest;

public interface PaymentService {

    PaymentResponse createPayment(CreatePaymentRequest request);

    PaymentResponse getPaymentById(Long paymentId);

    List<PaymentResponse> getAllPayments();

    List<PaymentResponse> getPaymentsByCustomer(Long customerId);

    PaymentResponse updatePaymentStatus(
            Long paymentId,
            UpdatePaymentStatusRequest request,
            String verifierEmail
    );

    void deletePayment(Long paymentId);
}