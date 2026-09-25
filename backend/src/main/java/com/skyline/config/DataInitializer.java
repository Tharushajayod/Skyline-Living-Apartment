package com.skyline.config;

import com.skyline.entity.*;
import com.skyline.enums.*;
import com.skyline.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final SaleRepository saleRepository;
    private final OwnershipRecordRepository ownershipRecordRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           ApartmentRepository apartmentRepository,
                           SaleRepository saleRepository,
                           OwnershipRecordRepository ownershipRecordRepository,
                           ReservationRepository reservationRepository,
                           PaymentRepository paymentRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.apartmentRepository = apartmentRepository;
        this.saleRepository = saleRepository;
        this.ownershipRecordRepository = ownershipRecordRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            initUsers();
            initApartments();
            log.info("Skyline Living base master data check complete.");
        } catch (Exception e) {
            log.error("Error during master data initialization: {}", e.getMessage(), e);
        }
    }

    private void initUsers() {
        if (userRepository.count() == 0) {
            log.info("Seeding initial users...");

            User admin = User.builder()
                    .name("Admin User")
                    .email("admin@skylineliving.com")
                    .password(passwordEncoder.encode("admin123"))
                    .phone("+94 77 123 4567")
                    .role(UserRole.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .createdAt(LocalDateTime.now().minusMonths(6))
                    .build();

            User staff = User.builder()
                    .name("Staff Member")
                    .email("staff@skylineliving.com")
                    .password(passwordEncoder.encode("staff123"))
                    .phone("+94 77 234 5678")
                    .role(UserRole.STAFF)
                    .status(UserStatus.ACTIVE)
                    .createdAt(LocalDateTime.now().minusMonths(5))
                    .build();

            User customer1 = User.builder()
                    .name("Sarah Chen")
                    .email("sarah.chen@email.com")
                    .password(passwordEncoder.encode("customer123"))
                    .phone("+94 77 345 6789")
                    .role(UserRole.CUSTOMER)
                    .status(UserStatus.ACTIVE)
                    .createdAt(LocalDateTime.now().minusMonths(3))
                    .build();

            User customer2 = User.builder()
                    .name("Emily Tan")
                    .email("emily.tan@email.com")
                    .password(passwordEncoder.encode("customer123"))
                    .phone("+94 77 456 7890")
                    .role(UserRole.CUSTOMER)
                    .status(UserStatus.ACTIVE)
                    .createdAt(LocalDateTime.now().minusMonths(2))
                    .build();

            userRepository.saveAll(Arrays.asList(admin, staff, customer1, customer2));
        }
    }

    private void initApartments() {
        if (apartmentRepository.count() == 0) {
            log.info("Seeding initial apartments...");

            Apartment apt1 = Apartment.builder()
                    .apartmentNumber("APT-001")
                    .title("Skyline Grand Penthouse")
                    .buildingName("Skyline Tower One")
                    .type(ApartmentType.PENTHOUSE)
                    .status(ApartmentStatus.AVAILABLE)
                    .price(new BigDecimal("28500000"))
                    .floor(38)
                    .size(245.0)
                    .bedrooms(4)
                    .bathrooms(4)
                    .address("100 Galle Face Center Road")
                    .city("Colombo")
                    .district("Colombo 01")
                    .description("Ultra-luxurious duplex penthouse with panoramic ocean views, private rooftop terrace, infinity plunge pool, and bespoke Italian kitchen finishings.")
                    .yearBuilt(2025)
                    .floorPlanUrl("https://images.pexels.com/photos/8135492/pexels-photo-8135492.jpeg")
                    .facilitiesList(Arrays.asList("Swimming Pool", "Gym & Fitness Center", "24/7 Security", "Concierge Service", "Smart Home System", "Rooftop Garden"))
                    .latitude(6.9271)
                    .longitude(79.8612)
                    .featured(true)
                    .createdAt(LocalDateTime.now().minusMonths(4))
                    .build();

            apt1.addImage(ApartmentImage.builder().url("https://images.pexels.com/photos/16110999/pexels-photo-16110999.jpeg").caption("Exterior View").build());
            apt1.addImage(ApartmentImage.builder().url("https://images.pexels.com/photos/8135492/pexels-photo-8135492.jpeg").caption("Living Area").build());
            apt1.addImage(ApartmentImage.builder().url("https://images.pexels.com/photos/7045356/pexels-photo-7045356.jpeg").caption("Kitchen").build());

            Apartment apt2 = Apartment.builder()
                    .apartmentNumber("APT-002")
                    .title("Marina View Executive Suite")
                    .buildingName("Skyline Marina Bay")
                    .type(ApartmentType.TWO_BEDROOM)
                    .status(ApartmentStatus.RESERVED)
                    .price(new BigDecimal("18200000"))
                    .floor(22)
                    .size(128.0)
                    .bedrooms(2)
                    .bathrooms(2)
                    .address("45 Marine Drive")
                    .city("Colombo")
                    .district("Colombo 03")
                    .description("Sophisticated 2-bedroom executive apartment featuring uninterrupted waterfront views, floor-to-ceiling double-glazed windows, and premium marble flooring.")
                    .yearBuilt(2024)
                    .facilitiesList(Arrays.asList("Swimming Pool", "Gym & Fitness Center", "24/7 Security", "Underground Parking", "Central Air Conditioning"))
                    .latitude(6.9022)
                    .longitude(79.8540)
                    .featured(true)
                    .createdAt(LocalDateTime.now().minusMonths(3))
                    .build();

            apt2.addImage(ApartmentImage.builder().url("https://images.pexels.com/photos/14998334/pexels-photo-14998334.jpeg").caption("Exterior View").build());
            apt2.addImage(ApartmentImage.builder().url("https://images.pexels.com/photos/8135496/pexels-photo-8135496.jpeg").caption("Living Room").build());

            Apartment apt3 = Apartment.builder()
                    .apartmentNumber("APT-003")
                    .title("Garden Terrace City Suite")
                    .buildingName("Skyline Heights")
                    .type(ApartmentType.ONE_BEDROOM)
                    .status(ApartmentStatus.AVAILABLE)
                    .price(new BigDecimal("9800000"))
                    .floor(8)
                    .size(72.0)
                    .bedrooms(1)
                    .bathrooms(1)
                    .address("12 Albert Crescent")
                    .city("Colombo")
                    .district("Colombo 07")
                    .description("Charming 1-bedroom suite with a private landscaped terrace balcony, open-plan designer living, and quiet leafy courtyard surroundings.")
                    .yearBuilt(2023)
                    .facilitiesList(Arrays.asList("Gym & Fitness Center", "24/7 Security", "Elevator", "Bicycle Storage", "Private Balcony"))
                    .latitude(6.9110)
                    .longitude(79.8650)
                    .featured(false)
                    .createdAt(LocalDateTime.now().minusMonths(2))
                    .build();

            apt3.addImage(ApartmentImage.builder().url("https://images.pexels.com/photos/31656167/pexels-photo-31656167.jpeg").caption("Terrace Suite").build());
            apt3.addImage(ApartmentImage.builder().url("https://images.pexels.com/photos/6585598/pexels-photo-6585598.jpeg").caption("Interior Lounge").build());

            Apartment apt4 = Apartment.builder()
                    .apartmentNumber("APT-004")
                    .title("Riverside Royal Loft")
                    .buildingName("Skyline Riverfront")
                    .type(ApartmentType.THREE_BEDROOM)
                    .status(ApartmentStatus.AVAILABLE)
                    .price(new BigDecimal("22500000"))
                    .floor(15)
                    .size(165.0)
                    .bedrooms(3)
                    .bathrooms(3)
                    .address("88 Nawala Road")
                    .city("Colombo")
                    .district("Rajagiriya")
                    .description("Spacious 3-bedroom luxury residence with designer lighting, master walk-in wardrobe, and tranquil riverfront views.")
                    .yearBuilt(2024)
                    .facilitiesList(Arrays.asList("Swimming Pool", "24/7 Security", "Children’s Playground", "Sauna & Spa", "EV Charging Stations"))
                    .latitude(6.9080)
                    .longitude(79.8920)
                    .featured(false)
                    .createdAt(LocalDateTime.now().minusMonths(5))
                    .build();

            apt4.addImage(ApartmentImage.builder().url("https://images.pexels.com/photos/39485845/pexels-photo-39485845.jpeg").caption("Exterior").build());

            apartmentRepository.saveAll(Arrays.asList(apt1, apt2, apt3, apt4));
        }
    }
}

