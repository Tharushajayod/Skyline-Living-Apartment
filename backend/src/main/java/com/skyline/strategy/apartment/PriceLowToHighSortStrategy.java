package com.skyline.strategy.apartment;

import com.skyline.dto.apartment.ApartmentResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Concrete Strategy: Sorts apartments by price in ascending order (Low to High).
 */
@Component
public class PriceLowToHighSortStrategy implements ApartmentSortStrategy {

    public static final String KEY = "price-asc";

    @Override
    public String getSortKey() {
        return KEY;
    }

    @Override
    public List<ApartmentResponse> sort(List<ApartmentResponse> apartments) {
        if (apartments == null || apartments.size() <= 1) {
            return apartments;
        }
        List<ApartmentResponse> sorted = new ArrayList<>(apartments);
        sorted.sort((a, b) -> {
            BigDecimal priceA = a.getPrice();
            BigDecimal priceB = b.getPrice();
            if (priceA == null && priceB == null) return 0;
            if (priceA == null) return 1;
            if (priceB == null) return -1;
            return priceA.compareTo(priceB); // Low to high (ascending)
        });
        return sorted;
    }
}
