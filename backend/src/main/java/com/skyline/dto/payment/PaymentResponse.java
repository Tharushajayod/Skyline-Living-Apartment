package com.skyline.dto.payment;

import com.skyline.entity.Payment;
import com.skyline.enums.PaymentStatus;
import com.skyline.enums.PaymentType;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private String id;

    private String reservationId;

    private String apartmentId;

    private String paymentPlanId;

    private String paymentPlanItemId;

    private String apartmentTitle;

    private String customerName;

    private PaymentType type;

    private BigDecimal amount;

    private PaymentStatus status;

    private String proofUrl;

    private String receiptUrl;

    private String uploadedAt;

    private String verifiedAt;

    private String verifiedBy;

    private String notes;

    public static PaymentResponse fromEntity(Payment payment) {

        if (payment == null) {
            return null;
        }

        return PaymentResponse.builder()

                .id(IdParser.formatId(
                        "PAY",
                        payment.getId()
                ))

                .reservationId(
                        payment.getReservation() != null
                                ? IdParser.formatId(
                                        "RSV",
                                        payment.getReservation().getId()
                                )
                                : null
                )

                .apartmentId(
                        payment.getApartment() != null
                                ? IdParser.formatId(
                                        "APT",
                                        payment.getApartment().getId()
                                )
                                : null
                )

                .paymentPlanId(
                        payment.getPaymentPlan() != null
                                ? IdParser.formatId(
                                        "PLN",
                                        payment.getPaymentPlan().getId()
                                )
                                : null
                )

                .paymentPlanItemId(
                        payment.getPaymentPlanItem() != null
                                ? IdParser.formatId(
                                        "PLI",
                                        payment.getPaymentPlanItem().getId()
                                )
                                : null
                )

                .apartmentTitle(payment.getApartmentTitle())

                .customerName(payment.getCustomerName())

                .type(payment.getType())

                .amount(payment.getAmount())

                .status(payment.getStatus())

                .proofUrl(payment.getProofUrl())

                .receiptUrl(payment.getReceiptUrl())

                .uploadedAt(
                        payment.getUploadedAt() != null
                                ? payment.getUploadedAt()
                                .format(DateTimeFormatter.ISO_DATE_TIME)
                                : null
                )

                .verifiedAt(
                        payment.getVerifiedAt() != null
                                ? payment.getVerifiedAt()
                                .format(DateTimeFormatter.ISO_DATE_TIME)
                                : null
                )

                .verifiedBy(payment.getVerifiedBy())

                .notes(payment.getNotes())

                .build();
    }
}