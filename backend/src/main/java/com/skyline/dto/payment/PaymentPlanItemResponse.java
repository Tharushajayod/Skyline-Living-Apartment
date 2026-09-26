package com.skyline.dto.payment;

import com.skyline.entity.PaymentPlanItem;
import com.skyline.enums.PaymentPlanItemStatus;
import com.skyline.util.IdParser;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentPlanItemResponse {

    private String id;
    private Integer sequenceNo;
    private BigDecimal amount;
    private String dueDate;
    private PaymentPlanItemStatus status;

    public static PaymentPlanItemResponse fromEntity(
            PaymentPlanItem item
    ) {

        return PaymentPlanItemResponse.builder()
                .id(
                        IdParser.formatId(
                                "PLI",
                                item.getId()
                        )
                )
                .sequenceNo(item.getSequenceNo())
                .amount(item.getAmount())
                .dueDate(
                        item.getDueDate() != null
                                ? item.getDueDate().toString()
                                : null
                )
                .status(item.getStatus())
                .build();
    }
}