package com.skyline.service;

import java.util.List;

import com.skyline.dto.payment.CreatePaymentRequest;
import com.skyline.dto.payment.PaymentDashboardSummaryResponse;
import com.skyline.dto.payment.PaymentDetailsResponse;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.payment.PaymentStatusReportResponse;
import com.skyline.dto.payment.UpdatePaymentStatusRequest;
import com.skyline.dto.payment.PaymentDashboardSummaryResponse;
import com.skyline.dto.payment.MonthlyRevenueResponse;
import com.skyline.dto.payment.PaymentMethodRevenueResponse;
import com.skyline.dto.payment.RecentTransactionResponse;

public interface PaymentService {

    PaymentResponse createPayment(CreatePaymentRequest request);

    PaymentResponse getPaymentById(Long paymentId);

    List<PaymentResponse> getAllPayments();

    List<PaymentResponse> getPaymentsByCustomer(Long customerId);

    List<PaymentResponse> getMyPayments(String email);

    PaymentResponse updatePaymentStatus(
            Long paymentId,
            UpdatePaymentStatusRequest request,
            String verifierEmail
    );

    void deletePayment(Long paymentId);

    PaymentDetailsResponse getPaymentDetails(
            Long paymentId,
            String userEmail
    );

    List<PaymentResponse> getPaymentsByStatus(String paymentStatus);

    PaymentDashboardSummaryResponse getDashboardSummary();

    List<MonthlyRevenueResponse> getMonthlyRevenue(
            Integer year
    );

    PaymentStatusReportResponse getPaymentStatusReport();

    List<PaymentResponse> getOutstandingPayments();

    List<PaymentMethodRevenueResponse>getRevenueByPaymentMethod();

    List<RecentTransactionResponse>getRecentTransactions(int limit);
}