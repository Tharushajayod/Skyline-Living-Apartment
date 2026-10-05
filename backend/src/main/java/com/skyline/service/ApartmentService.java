package com.skyline.service;

import com.skyline.dto.apartment.ApartmentImageDto;
import com.skyline.dto.apartment.ApartmentRequest;
import com.skyline.dto.apartment.ApartmentResponse;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentImage;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Sale;
import com.skyline.enums.ApartmentType;
import com.skyline.enums.UserRole;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ConflictException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.repository.ApartmentRepository;
import com.skyline.repository.SaleRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.strategy.apartment.*;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;
    private final SaleRepository saleRepository;
    private final ApartmentSortContext apartmentSortContext;
    private final ApartmentAvailabilityService availabilityService;

    public ApartmentService(
            ApartmentRepository apartmentRepository,
            SaleRepository saleRepository) {
        this(apartmentRepository, saleRepository, new ApartmentSortContext(List.of(
                new NewestSortStrategy(),
                new PriceLowToHighSortStrategy(),
                new PriceHighToLowSortStrategy(),
                new LargestFloorAreaSortStrategy())),
                new ApartmentAvailabilityService(apartmentRepository, null, saleRepository));
    }

    public ApartmentService(
            ApartmentRepository apartmentRepository,
            SaleRepository saleRepository,
            ApartmentSortContext apartmentSortContext) {
        this(apartmentRepository, saleRepository, apartmentSortContext,
                new ApartmentAvailabilityService(apartmentRepository, null, saleRepository));
    }

    @Autowired
    public ApartmentService(
            ApartmentRepository apartmentRepository,
            SaleRepository saleRepository,
            ApartmentSortContext apartmentSortContext,
            ApartmentAvailabilityService availabilityService) {

        this.apartmentRepository = apartmentRepository;
        this.saleRepository = saleRepository;
        this.apartmentSortContext = apartmentSortContext;
        this.availabilityService = availabilityService;
    }

    // Dynamic combined search & filter (backward-compatible overload without sort or principal)
    public List<ApartmentResponse> searchApartments(
            String search,
            ApartmentType type,
            ApartmentStatus status,
            String district,
            Integer bedrooms,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean featured) {
        return searchApartments(search, type, status, district, bedrooms, minPrice, maxPrice, featured, false, null, null);
    }

    public List<ApartmentResponse> searchApartments(
            String search,
            ApartmentType type,
            ApartmentStatus status,
            String district,
            Integer bedrooms,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean featured,
            Boolean includeSold) {
        return searchApartments(search, type, status, district, bedrooms, minPrice, maxPrice, featured, includeSold, null, null);
    }

    public List<ApartmentResponse> searchApartments(
            String search,
            ApartmentType type,
            ApartmentStatus status,
            String district,
            Integer bedrooms,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean featured,
            Boolean includeSold,
            String sort) {
        return searchApartments(search, type, status, district, bedrooms, minPrice, maxPrice, featured, includeSold, sort, null);
    }

    public List<ApartmentResponse> searchApartments(
            String search,
            ApartmentType type,
            ApartmentStatus status,
            String district,
            Integer bedrooms,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean featured,
            Boolean includeSold,
            String sort,
            UserPrincipal principal) {

        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        boolean isCustomer = principal != null && principal.getUser().getRole() == UserRole.CUSTOMER;

        // An anonymous or customer request specifically querying status=SOLD is denied if not staff/admin
        if (status == ApartmentStatus.SOLD && !isStaffOrAdmin) {
            if (!isCustomer) {
                return List.of();
            }
        }

        Specification<Apartment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), pattern);
                Predicate buildingLike = cb.like(cb.lower(root.get("buildingName")), pattern);
                Predicate cityLike = cb.like(cb.lower(root.get("city")), pattern);
                Predicate districtLike = cb.like(cb.lower(root.get("district")), pattern);
                predicates.add(cb.or(titleLike, buildingLike, cityLike, districtLike));
            }

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            // Access authorization for SOLD status
            if (isStaffOrAdmin) {
                if (status != null) {
                    predicates.add(cb.equal(root.get("status"), status));
                } else if (!Boolean.TRUE.equals(includeSold)) {
                    predicates.add(cb.notEqual(root.get("status"), ApartmentStatus.SOLD));
                }
            } else if (isCustomer && Boolean.TRUE.equals(includeSold)) {
                // Customer requesting includeSold can only see unsold apartments + their own purchased units
                List<Sale> mySales = saleRepository.findByCustomerIdOrCustomerEmail(
                        principal.getId(), principal.getUser().getEmail());
                List<Long> myApartmentIds = mySales.stream()
                        .map(s -> s.getApartment().getId())
                        .collect(Collectors.toList());

                Predicate unsold = cb.notEqual(root.get("status"), ApartmentStatus.SOLD);
                if (!myApartmentIds.isEmpty()) {
                    Predicate mySold = root.get("id").in(myApartmentIds);
                    predicates.add(cb.or(unsold, mySold));
                } else {
                    predicates.add(unsold);
                }
                if (status != null) {
                    predicates.add(cb.equal(root.get("status"), status));
                }
            } else {
                // Anonymous or standard customer catalog: NEVER expose SOLD apartments
                predicates.add(cb.notEqual(root.get("status"), ApartmentStatus.SOLD));
                if (status != null) {
                    predicates.add(cb.equal(root.get("status"), status));
                }
            }

            if (district != null && !district.trim().isEmpty() && !"all".equalsIgnoreCase(district.trim())) {
                predicates.add(cb.equal(cb.lower(root.get("district")), district.trim().toLowerCase()));
            }

            if (bedrooms != null && bedrooms > 0) {
                predicates.add(cb.equal(root.get("bedrooms"), bedrooms));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            if (featured != null) {
                predicates.add(cb.equal(root.get("featured"), featured));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<ApartmentResponse> results = apartmentRepository.findAll(spec).stream()
                .map(ApartmentResponse::fromEntity)
                .collect(Collectors.toList());

        // Strategy Pattern: execute runtime sorting strategy
        return apartmentSortContext.executeStrategy(sort, results);
    }

    public List<ApartmentResponse> getAllApartments() {
        return apartmentRepository.findAll().stream()
                .map(ApartmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Optional<ApartmentResponse> getApartmentById(Long id) {
        return getApartmentById(id, null);
    }

    public Optional<ApartmentResponse> getApartmentById(Long id, UserPrincipal principal) {
        return apartmentRepository.findById(id)
                .filter(apt -> availabilityService.canCustomerAccessApartment(apt, principal))
                .map(ApartmentResponse::fromEntity);
    }

    public Apartment getApartmentEntityById(Long id) {
        return apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + id));
    }

    @Transactional
    public ApartmentResponse createApartment(ApartmentRequest request) {
        validateApartmentRequest(request, false);

        String aptNumber = request.getApartmentNumber();
        if (aptNumber == null || aptNumber.trim().isEmpty()) {
            aptNumber = "APT-" + System.currentTimeMillis() % 10000;
        }

        Integer effectiveFloor = request.getFloor() != null ? request.getFloor() : request.getFloorNumber();
        Double effectiveSize = request.getSize() != null ? request.getSize() : request.getArea();
        String effectiveAddress = request.getAddress() != null ? request.getAddress() : request.getLocation();
        String effectiveCity = request.getCity() != null ? request.getCity() : "Colombo";
        String effectiveDistrict = request.getDistrict() != null ? request.getDistrict() : effectiveCity;

        Apartment apartment = Apartment.builder()
                .apartmentNumber(aptNumber)
                .title(request.getTitle())
                .buildingName(request.getBuildingName() != null ? request.getBuildingName() : "Skyline Tower")
                .type(request.getType() != null ? request.getType() : ApartmentType.TWO_BEDROOM)
                // System-managed: newly created apartment is ALWAYS AVAILABLE, client value is ignored
                .status(ApartmentStatus.AVAILABLE)
                .price(request.getPrice())
                .floor(effectiveFloor != null ? effectiveFloor : 0)
                .size(effectiveSize != null ? effectiveSize : 100.0)
                .bedrooms(request.getBedrooms() != null ? request.getBedrooms() : 1)
                .bathrooms(request.getBathrooms() != null ? request.getBathrooms() : 1)
                .address(effectiveAddress != null ? effectiveAddress : "")
                .city(effectiveCity)
                .district(effectiveDistrict)
                .description(request.getDescription() != null ? request.getDescription() : "")
                .yearBuilt(request.getYearBuilt() != null ? request.getYearBuilt() : Year.now().getValue())
                .floorPlanUrl(request.getFloorPlanUrl() != null ? request.getFloorPlanUrl() : "")
                .facilitiesList(
                        request.getFacilities() != null ? new ArrayList<>(request.getFacilities()) : new ArrayList<>())
                .latitude(request.getLatitude() != null ? request.getLatitude() : 6.9271)
                .longitude(request.getLongitude() != null ? request.getLongitude() : 79.8612)
                .featured(request.getFeatured() != null ? request.getFeatured() : false)
                .createdAt(LocalDateTime.now())
                .build();

        if (request.getImages() != null && !request.getImages().isEmpty()) {
            for (ApartmentImageDto imgDto : request.getImages()) {
                if (imgDto.getUrl() != null && !imgDto.getUrl().trim().isEmpty()) {
                    apartment.addImage(ApartmentImage.builder()
                            .url(imgDto.getUrl().trim())
                            .caption(imgDto.getCaption() != null ? imgDto.getCaption().trim() : "")
                            .build());
                }
            }
        } else if (request.getImageUrl() != null && !request.getImageUrl().trim().isEmpty()) {
            apartment.addImage(ApartmentImage.builder()
                    .url(request.getImageUrl().trim())
                    .caption("Exterior")
                    .build());
        }

        Apartment saved = apartmentRepository.save(apartment);
        return ApartmentResponse.fromEntity(saved);
    }

    @Transactional
    public ApartmentResponse updateApartment(Long id, ApartmentRequest request) {
        Apartment existing = getApartmentEntityById(id);

        if (existing.getStatus() == ApartmentStatus.SOLD ||
                saleRepository.findByApartmentId(id).isPresent()) {
            throw new ConflictException(
                    "Sold apartments cannot be edited because they are part of completed sales records.");
        }

        validateApartmentRequest(request, true);

        if (request.getTitle() != null)
            existing.setTitle(request.getTitle());
        if (request.getBuildingName() != null)
            existing.setBuildingName(request.getBuildingName());
        if (request.getType() != null)
            existing.setType(request.getType());

        // CRITICAL: DO NOT overwrite status! Preserves system-managed lifecycle status.

        if (request.getPrice() != null)
            existing.setPrice(request.getPrice());
        if (request.getFloor() != null)
            existing.setFloor(request.getFloor());
        if (request.getFloorNumber() != null && request.getFloor() == null)
            existing.setFloor(request.getFloorNumber());
        if (request.getSize() != null)
            existing.setSize(request.getSize());
        if (request.getArea() != null && request.getSize() == null)
            existing.setSize(request.getArea());
        if (request.getBedrooms() != null)
            existing.setBedrooms(request.getBedrooms());
        if (request.getBathrooms() != null)
            existing.setBathrooms(request.getBathrooms());
        if (request.getAddress() != null)
            existing.setAddress(request.getAddress());
        if (request.getLocation() != null && request.getAddress() == null)
            existing.setAddress(request.getLocation());
        if (request.getCity() != null)
            existing.setCity(request.getCity());
        if (request.getDistrict() != null)
            existing.setDistrict(request.getDistrict());
        if (request.getDescription() != null)
            existing.setDescription(request.getDescription());
        if (request.getYearBuilt() != null)
            existing.setYearBuilt(request.getYearBuilt());
        if (request.getFloorPlanUrl() != null)
            existing.setFloorPlanUrl(request.getFloorPlanUrl());
        if (request.getLatitude() != null)
            existing.setLatitude(request.getLatitude());
        if (request.getLongitude() != null)
            existing.setLongitude(request.getLongitude());
        if (request.getFeatured() != null)
            existing.setFeatured(request.getFeatured());

        if (request.getFacilities() != null) {
            existing.getFacilitiesList().clear();
            existing.getFacilitiesList().addAll(request.getFacilities());
        }

        if (request.getImages() != null) {
            existing.getImages().clear();
            for (ApartmentImageDto imgDto : request.getImages()) {
                if (imgDto.getUrl() != null && !imgDto.getUrl().trim().isEmpty()) {
                    existing.addImage(ApartmentImage.builder()
                            .url(imgDto.getUrl().trim())
                            .caption(imgDto.getCaption() != null ? imgDto.getCaption().trim() : "")
                            .build());
                }
            }
        }

        Apartment saved = apartmentRepository.save(existing);
        return ApartmentResponse.fromEntity(saved);
    }

    private void validateApartmentRequest(ApartmentRequest request, boolean isUpdate) {
        if (request == null) {
            throw new BadRequestException("Apartment request cannot be null");
        }

        if (!isUpdate && (request.getTitle() == null || request.getTitle().trim().isEmpty())) {
            throw new BadRequestException("Title is required");
        }

        // Price validation: Required on create, must be > 0
        if (!isUpdate && request.getPrice() == null) {
            throw new BadRequestException("Price is required");
        }
        if (request.getPrice() != null && request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Price must be greater than Rs. 0");
        }

        // Floor validation: Required on create, whole integer >= 0 (0 is valid for ground floor)
        Integer floor = request.getFloor() != null ? request.getFloor() : request.getFloorNumber();
        if (!isUpdate && floor == null) {
            throw new BadRequestException("Floor is required");
        }
        if (floor != null && floor < 0) {
            throw new BadRequestException("Floor cannot be negative");
        }

        // Size validation: Required on create, must be > 0
        Double size = request.getSize() != null ? request.getSize() : request.getArea();
        if (!isUpdate && size == null) {
            throw new BadRequestException("Size is required");
        }
        if (size != null && size <= 0) {
            throw new BadRequestException("Size must be greater than 0 sqm");
        }

        // Bedrooms validation: Required on create, must be >= 1
        if (!isUpdate && request.getBedrooms() == null) {
            throw new BadRequestException("Bedrooms is required");
        }
        if (request.getBedrooms() != null && request.getBedrooms() < 1) {
            throw new BadRequestException("Bedrooms must be at least 1");
        }

        // Bathrooms validation: Required on create, must be >= 1
        if (!isUpdate && request.getBathrooms() == null) {
            throw new BadRequestException("Bathrooms is required");
        }
        if (request.getBathrooms() != null && request.getBathrooms() < 1) {
            throw new BadRequestException("Bathrooms must be at least 1");
        }

        // Year built validation: Required on create, 1980 <= yearBuilt <= currentYear
        int currentYear = Year.now().getValue();
        if (!isUpdate && request.getYearBuilt() == null) {
            throw new BadRequestException("Year built is required");
        }
        if (request.getYearBuilt() != null) {
            if (request.getYearBuilt() < 1980) {
                throw new BadRequestException("Year built must be 1980 or later");
            }
            if (request.getYearBuilt() > currentYear) {
                throw new BadRequestException("Year built cannot be in the future");
            }
        }
    }

    // Backward compatible raw entity methods
    @Transactional
    public Apartment createApartment(Apartment apartment) {
        if (apartment.getApartmentNumber() == null || apartment.getApartmentNumber().trim().isEmpty()) {
            apartment.setApartmentNumber("APT-" + System.currentTimeMillis() % 10000);
        }
        apartment.setStatus(ApartmentStatus.AVAILABLE);
        if (apartment.getCreatedAt() == null) {
            apartment.setCreatedAt(LocalDateTime.now());
        }
        return apartmentRepository.save(apartment);
    }

    @Transactional
    public Apartment updateApartment(Apartment apartment) {
        if (apartment.getId() != null) {
            Apartment existing = apartmentRepository.findById(apartment.getId()).orElse(null);
            if (existing != null && (existing.getStatus() == ApartmentStatus.SOLD ||
                    saleRepository.findByApartmentId(existing.getId()).isPresent())) {
                throw new ConflictException(
                        "Sold apartments cannot be edited because they are part of completed sales records.");
            }
        }
        return apartmentRepository.save(apartment);
    }

    @Transactional
    public void deleteApartment(Long id) {
        Apartment apartment = getApartmentEntityById(id);

        if (apartment.getStatus() == ApartmentStatus.SOLD ||
                saleRepository.findByApartmentId(id).isPresent()) {
            throw new ConflictException(
                    "Sold apartments cannot be deleted because they are part of completed sales records.");
        }

        apartmentRepository.delete(apartment);
    }

    public List<ApartmentResponse> getApartmentsByStatus(ApartmentStatus status) {
        return apartmentRepository.findByStatus(status).stream()
                .map(ApartmentResponse::fromEntity)
                .collect(Collectors.toList());
    }
}