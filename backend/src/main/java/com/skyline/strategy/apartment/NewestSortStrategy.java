package com.skyline.strategy.apartment;

import com.skyline.dto.apartment.ApartmentResponse;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Concrete Strategy: Sorts apartments by newest creation date descending.
 */
@Component
public class NewestSortStrategy implements ApartmentSortStrategy {

    public static final String KEY = "newest";

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
            String dateA = a.getCreatedAt();
            String dateB = b.getCreatedAt();
            if (dateA == null && dateB == null) return 0;
            if (dateA == null) return 1;
            if (dateB == null) return -1;
            return dateB.compareTo(dateA); // Newest first (descending)
        });
        return sorted;
    }
}
