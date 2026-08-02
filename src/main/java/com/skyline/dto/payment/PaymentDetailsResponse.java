package com.skyline.dto.payment;

import java.util.List;

import com.skyline.dto.payment.PaymentEvidenceResponse;
import com.skyline.dto.payment.PaymentResponse;
import com.skyline.dto.payment.TransactionResponse;

public record PaymentDetailsResponse(

        PaymentResponse payment,
        List<PaymentEvidenceResponse> evidence,
        List<TransactionResponse> transactions

) {
}