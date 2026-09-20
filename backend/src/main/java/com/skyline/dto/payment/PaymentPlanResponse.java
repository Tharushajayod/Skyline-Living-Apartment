package com.skyline.dto.payment;

import com.skyline.entity.PaymentPlan;
import com.skyline.enums.PaymentPlanStatus;
import com.skyline.enums.PaymentPlanType;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentPlanResponse {

    private String id;

    private String reservationId;

    private String apartmentId;

    private String apartmentTitle;

    private String customerName;

    private String customerEmail;

    private PaymentPlanType planType;

    private Integer numberOfPayments;

    private BigDecimal paymentAmount;

    private BigDecimal totalPlanAmount;

    private BigDecimal remainingAmount;

    private String startDate;

    private PaymentPlanStatus status;

    private String customerNotes;

    private String adminNotes;

    private String approvedBy;

    private String approvedAt;

    private String createdAt;

    private List<PaymentPlanItemResponse> items;

    public static PaymentPlanResponse fromEntity(PaymentPlan plan) {

        if (plan == null) {
            return null;
        }

        return PaymentPlanResponse.builder()

                .id(IdParser.formatId("PLN", plan.getId()))

                .reservationId(
                        plan.getReservation() != null
                                ? IdParser.formatId(
                                        "RSV",
                                        plan.getReservation().getId()
                                )
                                : ""
                )

                .apartmentId(
                        plan.getApartment() != null
                                ? IdParser.formatId(
                                        "APT",
                                        plan.getApartment().getId()
                                )
                                : ""
                )

                .apartmentTitle(
                        plan.getApartment() != null
                                ? plan.getApartment().getTitle()
                                : ""
                )

                .customerName(
                        plan.getCustomer() != null
                                ? plan.getCustomer().getName()
                                : ""
                )

                .customerEmail(
                        plan.getCustomer() != null
                                ? plan.getCustomer().getEmail()
                                : ""
                )

                .planType(plan.getPlanType())

                .numberOfPayments(plan.getNumberOfPayments())

                .paymentAmount(plan.getPaymentAmount())

                .totalPlanAmount(plan.getTotalPlanAmount())

                .remainingAmount(plan.getRemainingAmount())

                .startDate(
                        plan.getStartDate() != null
                                ? plan.getStartDate().toString()
                                : null
                )

                .status(plan.getStatus())

                .customerNotes(plan.getCustomerNotes())

                .adminNotes(plan.getAdminNotes())

                .approvedBy(plan.getApprovedBy())

                .approvedAt(
                        plan.getApprovedAt() != null
                                ? plan.getApprovedAt()
                                    .format(DateTimeFormatter.ISO_DATE_TIME)
                                : null
                )

                .createdAt(
                        plan.getCreatedAt() != null
                                ? plan.getCreatedAt()
                                    .format(DateTimeFormatter.ISO_DATE_TIME)
                                : null
                )

                .build();
    }
}