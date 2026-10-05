package com.skyline.decorator.sale;

import com.skyline.dto.sale.SaleDetailsResponse;

/**
 * Decorator Pattern: Abstract Decorator.
 *
 * Maintains a reference to a SaleStatementComponent and implements the same interface,
 * allowing responsibilities to be attached dynamically at runtime.
 */
public abstract class SaleStatementDecorator implements SaleStatementComponent {

    // Decorator Pattern: reference to wrapped component
    protected final SaleStatementComponent decoratedStatement;

    public SaleStatementDecorator(SaleStatementComponent decoratedStatement) {
        this.decoratedStatement = decoratedStatement;
    }

    @Override
    public SaleDetailsResponse generateStatement() {
        return decoratedStatement.generateStatement();
    }
}
