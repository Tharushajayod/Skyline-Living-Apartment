package com.skyline.strategy.apartment;

import com.skyline.dto.apartment.ApartmentResponse;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Concrete Strategy: Sorts apartments by floor area / size in descending order (Largest first).
 */
@Component
public class LargestFloorAreaSortStrategy implements ApartmentSortStrategy {

    public static final String KEY = "size";

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
            Double sizeA = a.getSize() != null ? a.getSize() : a.getArea();
            Double sizeB = b.getSize() != null ? b.getSize() : b.getArea();
            if (sizeA == null && sizeB == null) return 0;
            if (sizeA == null) return 1;
            if (sizeB == null) return -1;
            return Double.compare(sizeB, sizeA); // Largest first (descending)
        });
        return sorted;
    }
}
