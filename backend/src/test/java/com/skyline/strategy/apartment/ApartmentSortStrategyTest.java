package com.skyline.strategy.apartment;

import com.skyline.dto.apartment.ApartmentResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ApartmentSortStrategyTest {

    private ApartmentSortContext sortContext;
    private List<ApartmentResponse> sampleApartments;

    @BeforeEach
    void setUp() {
        sortContext = new ApartmentSortContext(List.of(
                new NewestSortStrategy(),
                new PriceLowToHighSortStrategy(),
                new PriceHighToLowSortStrategy(),
                new LargestFloorAreaSortStrategy()
        ));

        sampleApartments = new ArrayList<>(List.of(
                ApartmentResponse.builder().id("1").title("Unit A").price(new BigDecimal("15000000")).size(85.0).createdAt("2026-09-01T10:00:00").build(),
                ApartmentResponse.builder().id("2").title("Unit B").price(new BigDecimal("9500000")).size(120.0).createdAt("2026-10-01T10:00:00").build(),
                ApartmentResponse.builder().id("3").title("Unit C").price(new BigDecimal("22000000")).size(65.0).createdAt("2026-08-15T10:00:00").build()
        ));
    }

    @Test
    @DisplayName("Strategy Pattern: NewestSortStrategy orders by createdAt descending")
    void testNewestSortStrategy() {
        List<ApartmentResponse> sorted = sortContext.executeStrategy("newest", sampleApartments);
        assertEquals("2", sorted.get(0).getId()); // 2026-10-01
        assertEquals("1", sorted.get(1).getId()); // 2026-09-01
        assertEquals("3", sorted.get(2).getId()); // 2026-08-15
    }

    @Test
    @DisplayName("Strategy Pattern: PriceLowToHighSortStrategy orders by price ascending")
    void testPriceLowToHighSortStrategy() {
        List<ApartmentResponse> sorted = sortContext.executeStrategy("price-asc", sampleApartments);
        assertEquals("2", sorted.get(0).getId()); // 9,500,000
        assertEquals("1", sorted.get(1).getId()); // 15,000,000
        assertEquals("3", sorted.get(2).getId()); // 22,000,000
    }

    @Test
    @DisplayName("Strategy Pattern: PriceHighToLowSortStrategy orders by price descending")
    void testPriceHighToLowSortStrategy() {
        List<ApartmentResponse> sorted = sortContext.executeStrategy("price-desc", sampleApartments);
        assertEquals("3", sorted.get(0).getId()); // 22,000,000
        assertEquals("1", sorted.get(1).getId()); // 15,000,000
        assertEquals("2", sorted.get(2).getId()); // 9,500,000
    }

    @Test
    @DisplayName("Strategy Pattern: LargestFloorAreaSortStrategy orders by size descending")
    void testLargestFloorAreaSortStrategy() {
        List<ApartmentResponse> sorted = sortContext.executeStrategy("size", sampleApartments);
        assertEquals("2", sorted.get(0).getId()); // 120.0
        assertEquals("1", sorted.get(1).getId()); // 85.0
        assertEquals("3", sorted.get(2).getId()); // 65.0
    }

    @Test
    @DisplayName("Strategy Pattern: Fallback to default strategy when key is null or unrecognized")
    void testFallbackDefaultStrategy() {
        List<ApartmentResponse> sorted = sortContext.executeStrategy(null, sampleApartments);
        assertEquals("2", sorted.get(0).getId()); // Default is newest
    }
}
