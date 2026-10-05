package com.skyline.service;

import com.skyline.dto.apartment.ApartmentRequest;
import com.skyline.dto.apartment.ApartmentResponse;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Sale;
import com.skyline.entity.User;
import com.skyline.enums.ApartmentType;
import com.skyline.enums.UserRole;
import com.skyline.enums.UserStatus;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ConflictException;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.Year;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApartmentServiceTest {

    @Mock
    private ApartmentRepository apartmentRepository;

    @Mock
    private SaleRepository saleRepository;

    private ApartmentAvailabilityService availabilityService;
    private ApartmentService apartmentService;

    private User buyer;
    private User otherCustomer;
    private User admin;
    private UserPrincipal buyerPrincipal;
    private UserPrincipal otherCustomerPrincipal;
    private UserPrincipal adminPrincipal;

    @BeforeEach
    void setUp() {
        availabilityService = new ApartmentAvailabilityService(apartmentRepository, null, saleRepository);
        apartmentService = new ApartmentService(apartmentRepository, saleRepository,
                new com.skyline.strategy.apartment.ApartmentSortContext(List.of(
                        new com.skyline.strategy.apartment.NewestSortStrategy(),
                        new com.skyline.strategy.apartment.PriceLowToHighSortStrategy(),
                        new com.skyline.strategy.apartment.PriceHighToLowSortStrategy(),
                        new com.skyline.strategy.apartment.LargestFloorAreaSortStrategy())),
                availabilityService);

        buyer = User.builder()
                .id(101L)
                .name("Alice Buyer")
                .email("alice@test.com")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();
        buyerPrincipal = new UserPrincipal(buyer);

        otherCustomer = User.builder()
                .id(102L)
                .name("Bob Stranger")
                .email("bob@test.com")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();
        otherCustomerPrincipal = new UserPrincipal(otherCustomer);

        admin = User.builder()
                .id(1L)
                .name("Admin User")
                .email("admin@skyline.com")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        adminPrincipal = new UserPrincipal(admin);
    }

    private ApartmentRequest.ApartmentRequestBuilder validRequestBuilder() {
        return ApartmentRequest.builder()
                .title("Skyline Luxury Suite")
                .buildingName("Tower A")
                .type(ApartmentType.TWO_BEDROOM)
                .price(new BigDecimal("15000000"))
                .floor(2)
                .size(85.0)
                .bedrooms(2)
                .bathrooms(2)
                .city("Colombo")
                .district("Colombo 03")
                .yearBuilt(2023);
    }

    @Test
    void testCreateApartmentSuccess() {
        ApartmentRequest request = validRequestBuilder().build();

        when(apartmentRepository.save(any(Apartment.class))).thenAnswer(invocation -> {
            Apartment a = invocation.getArgument(0);
            a.setId(1L);
            return a;
        });

        ApartmentResponse response = apartmentService.createApartment(request);

        assertNotNull(response);
        assertEquals("Skyline Luxury Suite", response.getTitle());
        assertEquals(ApartmentType.TWO_BEDROOM, response.getType());
        assertEquals(ApartmentStatus.AVAILABLE, response.getStatus());
        verify(apartmentRepository).save(any(Apartment.class));
    }

    @Test
    void testCreateApartmentIgnoresClientProvidedStatusAndForcesAvailable() {
        // Even if client attempts to inject RESERVED or SOLD on creation
        ApartmentRequest request = validRequestBuilder()
                .status(ApartmentStatus.SOLD)
                .build();

        when(apartmentRepository.save(any(Apartment.class))).thenAnswer(invocation -> {
            Apartment a = invocation.getArgument(0);
            a.setId(2L);
            return a;
        });

        ApartmentResponse response = apartmentService.createApartment(request);
        assertEquals(ApartmentStatus.AVAILABLE, response.getStatus(), "Newly created apartment MUST be AVAILABLE regardless of client status");
    }

    // ==========================================
    // Numeric Field Validations
    // ==========================================

    @Test
    void testCreateApartmentNegativePriceRejected() {
        ApartmentRequest request = validRequestBuilder().price(new BigDecimal("-100000")).build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> apartmentService.createApartment(request));
        assertTrue(ex.getMessage().contains("Price must be greater than Rs. 0"));
    }

    @Test
    void testCreateApartmentZeroPriceRejected() {
        ApartmentRequest request = validRequestBuilder().price(BigDecimal.ZERO).build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> apartmentService.createApartment(request));
        assertTrue(ex.getMessage().contains("Price must be greater than Rs. 0"));
    }

    @Test
    void testCreateApartmentNegativeSizeRejected() {
        ApartmentRequest request = validRequestBuilder().size(-50.0).build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> apartmentService.createApartment(request));
        assertTrue(ex.getMessage().contains("Size must be greater than 0 sqm"));
    }

    @Test
    void testCreateApartmentZeroSizeRejected() {
        ApartmentRequest request = validRequestBuilder().size(0.0).build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> apartmentService.createApartment(request));
        assertTrue(ex.getMessage().contains("Size must be greater than 0 sqm"));
    }

    @Test
    void testCreateApartmentNegativeFloorRejected() {
        ApartmentRequest request = validRequestBuilder().floor(-2).build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> apartmentService.createApartment(request));
        assertTrue(ex.getMessage().contains("Floor cannot be negative"));
    }

    @Test
    void testCreateApartmentGroundFloorZeroAccepted() {
        ApartmentRequest request = validRequestBuilder().floor(0).build();
        when(apartmentRepository.save(any(Apartment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ApartmentResponse response = apartmentService.createApartment(request);
        assertEquals(0, response.getFloor(), "Floor 0 (Ground Floor) must be accepted");
    }

    @Test
    void testCreateApartmentNegativeBedroomsRejected() {
        ApartmentRequest request = validRequestBuilder().bedrooms(-2).build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> apartmentService.createApartment(request));
        assertTrue(ex.getMessage().contains("Bedrooms must be at least 1"));
    }

    @Test
    void testCreateApartmentZeroBedroomsRejected() {
        ApartmentRequest request = validRequestBuilder().bedrooms(0).build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> apartmentService.createApartment(request));
        assertTrue(ex.getMessage().contains("Bedrooms must be at least 1"));
    }

    @Test
    void testCreateApartmentBedroomsAtLeastOneAccepted() {
        ApartmentRequest request = validRequestBuilder().bedrooms(1).build();
        when(apartmentRepository.save(any(Apartment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ApartmentResponse response = apartmentService.createApartment(request);
        assertEquals(1, response.getBedrooms());
    }

    @Test
    void testCreateApartmentZeroBathroomsRejected() {
        ApartmentRequest request = validRequestBuilder().bathrooms(0).build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> apartmentService.createApartment(request));
        assertTrue(ex.getMessage().contains("Bathrooms must be at least 1"));
    }

    @Test
    void testCreateApartmentNegativeBathroomsRejected() {
        ApartmentRequest request = validRequestBuilder().bathrooms(-1).build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> apartmentService.createApartment(request));
        assertTrue(ex.getMessage().contains("Bathrooms must be at least 1"));
    }

    @Test
    void testCreateApartmentYearBefore1980Rejected() {
        ApartmentRequest request = validRequestBuilder().yearBuilt(1975).build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> apartmentService.createApartment(request));
        assertTrue(ex.getMessage().contains("Year built must be 1980 or later"));
    }

    @Test
    void testCreateApartmentFutureYearRejected() {
        int futureYear = Year.now().getValue() + 2;
        ApartmentRequest request = validRequestBuilder().yearBuilt(futureYear).build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> apartmentService.createApartment(request));
        assertTrue(ex.getMessage().contains("Year built cannot be in the future"));
    }

    @Test
    void testCreateApartmentCurrentYearAccepted() {
        int currentYear = Year.now().getValue();
        ApartmentRequest request = validRequestBuilder().yearBuilt(currentYear).build();
        when(apartmentRepository.save(any(Apartment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ApartmentResponse response = apartmentService.createApartment(request);
        assertEquals(currentYear, response.getYearBuilt());
    }

    // ==========================================
    // Update & Lifecycle Status Preservation
    // ==========================================

    @Test
    void testUpdateApartmentPreservesSystemManagedStatus() {
        Apartment existingApt = Apartment.builder()
                .id(10L)
                .title("Old Title")
                .status(ApartmentStatus.RESERVED)
                .price(new BigDecimal("10000000"))
                .build();
        when(apartmentRepository.findById(10L)).thenReturn(Optional.of(existingApt));
        when(saleRepository.findByApartmentId(10L)).thenReturn(Optional.empty());
        when(apartmentRepository.save(any(Apartment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Client attempts to manually switch status from RESERVED to AVAILABLE
        ApartmentRequest updateReq = ApartmentRequest.builder()
                .title("New Title")
                .status(ApartmentStatus.AVAILABLE)
                .build();

        ApartmentResponse response = apartmentService.updateApartment(10L, updateReq);
        assertEquals("New Title", response.getTitle());
        assertEquals(ApartmentStatus.RESERVED, response.getStatus(), "Client edit MUST NOT overwrite system-managed status");
    }

    @Test
    void testUpdateSoldApartmentFails() {
        Apartment soldApt = Apartment.builder()
                .id(99L)
                .title("Sold Penthouse")
                .status(ApartmentStatus.SOLD)
                .build();
        when(apartmentRepository.findById(99L)).thenReturn(Optional.of(soldApt));

        ApartmentRequest updateReq = ApartmentRequest.builder().title("New Title").build();
        assertThrows(ConflictException.class, () -> apartmentService.updateApartment(99L, updateReq));
        verify(apartmentRepository, never()).save(any());
    }

    @Test
    void testDeleteSoldApartmentFails() {
        Apartment soldApt = Apartment.builder()
                .id(99L)
                .title("Sold Penthouse")
                .status(ApartmentStatus.SOLD)
                .build();
        when(apartmentRepository.findById(99L)).thenReturn(Optional.of(soldApt));

        assertThrows(ConflictException.class, () -> apartmentService.deleteApartment(99L));
        verify(apartmentRepository, never()).delete(any(Apartment.class));
    }

    // ==========================================
    // SOLD Visibility and Direct Access Security
    // ==========================================

    @Test
    void testGetApartmentByIdForSoldApartmentAccessControl() {
        Apartment soldApt = Apartment.builder()
                .id(50L)
                .title("Sold Luxury Villa")
                .status(ApartmentStatus.SOLD)
                .build();

        Sale sale = Sale.builder()
                .id(1L)
                .apartment(soldApt)
                .customer(buyer)
                .customerEmail("alice@test.com")
                .build();

        when(apartmentRepository.findById(50L)).thenReturn(Optional.of(soldApt));
        when(saleRepository.findByApartmentId(50L)).thenReturn(Optional.of(sale));

        // 1. Anonymous user cannot access SOLD apartment
        Optional<ApartmentResponse> anonResult = apartmentService.getApartmentById(50L, null);
        assertTrue(anonResult.isEmpty(), "Anonymous user must NOT be able to view SOLD apartment");

        // 2. Unrelated customer cannot access SOLD apartment
        Optional<ApartmentResponse> otherResult = apartmentService.getApartmentById(50L, otherCustomerPrincipal);
        assertTrue(otherResult.isEmpty(), "Unrelated customer must NOT be able to view SOLD apartment");

        // 3. Buyer/Owner CAN view their SOLD apartment
        Optional<ApartmentResponse> buyerResult = apartmentService.getApartmentById(50L, buyerPrincipal);
        assertTrue(buyerResult.isPresent(), "Buyer/Owner must be able to view their SOLD apartment");
        assertEquals("Sold Luxury Villa", buyerResult.get().getTitle());

        // 4. Admin CAN view SOLD apartment
        Optional<ApartmentResponse> adminResult = apartmentService.getApartmentById(50L, adminPrincipal);
        assertTrue(adminResult.isPresent(), "Admin must be able to view SOLD apartment");
    }

    @Test
    void testSearchApartmentsWithFilters() {
        Apartment apt = Apartment.builder()
                .id(1L)
                .apartmentNumber("APT-001")
                .title("Marina Loft")
                .type(ApartmentType.TWO_BEDROOM)
                .status(ApartmentStatus.AVAILABLE)
                .price(new BigDecimal("15000000"))
                .bedrooms(2)
                .district("Colombo 01")
                .build();

        when(apartmentRepository.findAll(any(Specification.class)))
                .thenReturn(Collections.singletonList(apt));

        List<ApartmentResponse> results = apartmentService.searchApartments(
                "marina", ApartmentType.TWO_BEDROOM, ApartmentStatus.AVAILABLE, "Colombo 01", 2, null, null, null);

        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        assertEquals("Marina Loft", results.get(0).getTitle());
    }
}
