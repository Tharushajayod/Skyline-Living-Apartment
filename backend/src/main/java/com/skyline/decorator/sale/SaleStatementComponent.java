package com.skyline.decorator.sale;

import com.skyline.dto.sale.SaleDetailsResponse;

/**
 * Decorator Pattern: Component Interface.
 *
 * Defines the contract for generating sale statements and detailed records.
 * Can have additional details (e.g. payment breakdown, installment schedules)
 * attached dynamically at runtime.
 */
public interface SaleStatementComponent {

    /**
     * Generates and returns the sale details statement.
     */
    SaleDetailsResponse generateStatement();
}
