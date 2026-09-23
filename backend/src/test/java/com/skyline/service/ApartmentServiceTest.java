package com.skyline.service;

import com.skyline.dto.apartment.ApartmentRequest;
import com.skyline.dto.apartment.ApartmentResponse;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.enums.ApartmentType;
import com.skyline.repository.ApartmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
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
    private com.skyline.repository.SaleRepository saleRepository;

    @Mock
    private com.skyline.repository.OwnershipRecordRepository ownershipRecordRepository;

    private ApartmentService apartmentService;

    @BeforeEach
    void setUp() {
        apartmentService = new ApartmentService(apartmentRepository, saleRepository, ownershipRecordRepository);
    }

    @Test
    void testCreateApartmentSuccess() {
        ApartmentRequest request = ApartmentRequest.builder()
                .title("Luxury Studio")
                .buildingName("Skyline One")
                .type(ApartmentType.STUDIO)
                .price(new BigDecimal("12000000"))
                .bedrooms(1)
                .bathrooms(1)
                .size(50.0)
                .city("Colombo")
                .district("Colombo 03")
                .build();

        when(apartmentRepository.save(any(Apartment.class))).thenAnswer(invocation -> {
            Apartment a = invocation.getArgument(0);
            a.setId(1L);
            return a;
        });

        ApartmentResponse response = apartmentService.createApartment(request);

        assertNotNull(response);
        assertEquals("Luxury Studio", response.getTitle());
        assertEquals(ApartmentType.STUDIO, response.getType());
        assertEquals(ApartmentStatus.AVAILABLE, response.getStatus());
        verify(apartmentRepository).save(any(Apartment.class));
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

    @Test
    void testUpdateSoldApartmentFails() {
        Apartment soldApt = Apartment.builder()
                .id(99L)
                .title("Sold Penthouse")
                .status(ApartmentStatus.SOLD)
                .build();
        when(apartmentRepository.findById(99L)).thenReturn(Optional.of(soldApt));

        ApartmentRequest updateReq = ApartmentRequest.builder().title("New Title").build();
        assertThrows(com.skyline.exception.ConflictException.class, () -> apartmentService.updateApartment(99L, updateReq));
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

        assertThrows(com.skyline.exception.ConflictException.class, () -> apartmentService.deleteApartment(99L));
        verify(apartmentRepository, never()).delete(any(Apartment.class));
    }
}
