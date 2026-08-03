package com.skyline.dto.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RecentTransactionResponse(

        Long transactionId,
        String transactionNumber,
        String receiptNumber,
        Long paymentId,
        String customerName,
        BigDecimal transactionAmount,
        String transactionStatus,
        LocalDateTime processedDate

) {
}