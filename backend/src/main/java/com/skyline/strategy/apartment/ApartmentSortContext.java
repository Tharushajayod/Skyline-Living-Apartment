package com.skyline.strategy.apartment;

import com.skyline.dto.apartment.ApartmentResponse;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Strategy Pattern: Context for Apartment Sorting.
 * Maintains references to all registered concrete strategies and delegates sorting
 * to the appropriate strategy selected at runtime based on the requested sort key.
 */
@Component
public class ApartmentSortContext {

    // Strategy Pattern: Strategy lookup registry
    private final Map<String, ApartmentSortStrategy> strategyMap = new HashMap<>();
    private final ApartmentSortStrategy defaultStrategy;

    public ApartmentSortContext(List<ApartmentSortStrategy> strategies) {
        for (ApartmentSortStrategy strategy : strategies) {
            strategyMap.put(strategy.getSortKey().toLowerCase(), strategy);
        }
        // Fallback default strategy is Newest first
        this.defaultStrategy = strategyMap.getOrDefault(NewestSortStrategy.KEY, new NewestSortStrategy());
    }

    /**
     * Runtime Strategy Selection and execution.
     *
     * @param sortKey    the requested sort option (e.g., "newest", "price-asc", "price-desc", "size")
     * @param apartments the list of apartments to sort
     * @return the sorted list of apartments
     */
    public List<ApartmentResponse> executeStrategy(String sortKey, List<ApartmentResponse> apartments) {
        if (apartments == null || apartments.isEmpty()) {
            return apartments;
        }

        if (sortKey == null || sortKey.trim().isEmpty()) {
            return defaultStrategy.sort(apartments);
        }

        ApartmentSortStrategy strategy = strategyMap.getOrDefault(sortKey.trim().toLowerCase(), defaultStrategy);
        return strategy.sort(apartments);
    }
}
