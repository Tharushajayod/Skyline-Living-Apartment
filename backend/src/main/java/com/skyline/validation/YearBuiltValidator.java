package com.skyline.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.Year;

public class YearBuiltValidator implements ConstraintValidator<ValidYearBuilt, Integer> {

    @Override
    public boolean isValid(Integer value, ConstraintValidatorContext context) {
        if (value == null) {
            return true; // Let @NotNull handle presence check
        }

        int currentYear = Year.now().getValue();
        if (value < 1980) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Year built must be 1980 or later")
                    .addConstraintViolation();
            return false;
        }

        if (value > currentYear) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Year built cannot be in the future")
                    .addConstraintViolation();
            return false;
        }

        return true;
    }
}
