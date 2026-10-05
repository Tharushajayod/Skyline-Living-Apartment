package com.skyline.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = YearBuiltValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidYearBuilt {
    String message() default "Year built must be between 1980 and the current year";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
