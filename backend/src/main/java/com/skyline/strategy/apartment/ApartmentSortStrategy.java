package com.skyline.strategy.apartment;

import com.skyline.dto.apartment.ApartmentResponse;

import java.util.List;

/**
 * Strategy Pattern: Strategy Interface for Apartment Sorting.
 * Encapsulates sorting algorithms for apartment listings.
 */
public interface ApartmentSortStrategy {

    /**
     * Unique key identifying the sorting algorithm (e.g. "newest", "price-asc", "price-desc", "size").
     */
    String getSortKey();

    /**
     * Executes the sorting algorithm on the provided list of apartments.
     */
    List<ApartmentResponse> sort(List<ApartmentResponse> apartments);
}
