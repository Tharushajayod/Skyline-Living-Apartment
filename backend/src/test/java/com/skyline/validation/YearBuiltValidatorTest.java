package com.skyline.validation;

import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Year;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class YearBuiltValidatorTest {

    private YearBuiltValidator validator;

    @Mock
    private ConstraintValidatorContext context;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder builder;

    @BeforeEach
    void setUp() {
        validator = new YearBuiltValidator();
        lenient().when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(builder);
    }

    @Test
    void testYearBefore1980IsInvalid() {
        assertFalse(validator.isValid(1979, context));
        verify(context).disableDefaultConstraintViolation();
        verify(context).buildConstraintViolationWithTemplate("Year built must be 1980 or later");
    }

    @Test
    void testYear1980IsValid() {
        assertTrue(validator.isValid(1980, context));
    }

    @Test
    void testCurrentYearIsValid() {
        int currentYear = Year.now().getValue();
        assertTrue(validator.isValid(currentYear, context));
    }

    @Test
    void testFutureYearIsInvalid() {
        int nextYear = Year.now().getValue() + 1;
        assertFalse(validator.isValid(nextYear, context));
        verify(context).disableDefaultConstraintViolation();
        verify(context).buildConstraintViolationWithTemplate("Year built cannot be in the future");
    }

    @Test
    void testNullYearPassesToNotNull() {
        assertTrue(validator.isValid(null, context));
    }
}
