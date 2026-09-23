package com.skyline.service;

import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.appointment.RescheduleProposalRequest;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Appointment;
import com.skyline.entity.User;
import com.skyline.enums.AppointmentStatus;
import com.skyline.enums.RescheduleStatus;
import com.skyline.enums.UserRole;
import com.skyline.enums.UserStatus;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ForbiddenException;
import com.skyline.repository.AppointmentRepository;
import com.skyline.repository.AppointmentRescheduleHistoryRepository;
import com.skyline.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentWorkflowTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AppointmentRescheduleHistoryRepository appointmentRescheduleHistoryRepository;

    @Mock
    private ApartmentService apartmentService;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    private AppointmentService appointmentServiceInstance;

    private User customer;
    private User staff;
    private UserPrincipal customerPrincipal;
    private UserPrincipal staffPrincipal;
    private Apartment apartment;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        appointmentServiceInstance = new AppointmentService(
                appointmentRepository,
                appointmentRescheduleHistoryRepository,
                apartmentService,
                userService,
                notificationService
        );

        customer = User.builder()
                .id(10L)
                .name("Sarah Chen")
                .email("sarah.chen@email.com")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();

        staff = User.builder()
                .id(2L)
                .name("Alex Skyline Concierge")
                .email("staff@skylineliving.com")
                .role(UserRole.STAFF)
                .status(UserStatus.ACTIVE)
                .build();

        customerPrincipal = new UserPrincipal(customer);
        staffPrincipal = new UserPrincipal(staff);

        apartment = Apartment.builder()
                .id(1L)
                .title("Skyline Luxury Suite")
                .apartmentNumber("APT-101")
                .status(ApartmentStatus.AVAILABLE)
                .price(new BigDecimal("15000000"))
                .build();

        appointment = Appointment.builder()
                .id(100L)
                .apartment(apartment)
                .customer(customer)
                .customerName(customer.getName())
                .customerEmail(customer.getEmail())
                .customerPhone("+94771234567")
                .date(LocalDate.now().plusDays(2))
                .timeSlot("10:00 AM - 11:00 AM")
                .status(AppointmentStatus.APPROVED)
                .rescheduleStatus(RescheduleStatus.NONE)
                .build();
    }

    @Test
    void testStaffProposesRescheduleEntersPendingCustomer() {
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        RescheduleProposalRequest request = RescheduleProposalRequest.builder()
                .date(LocalDate.now().plusDays(4).toString())
                .timeSlot("02:00 PM - 03:00 PM")
                .reason("Concierge staff unavailable in morning")
                .build();

        AppointmentResponse res = appointmentServiceInstance.proposeReschedule(100L, request, staffPrincipal);

        assertEquals(RescheduleStatus.PENDING_CUSTOMER, appointment.getRescheduleStatus());
        assertEquals(LocalDate.now().plusDays(4), appointment.getProposedDate());
        assertEquals("02:00 PM - 03:00 PM", appointment.getProposedTimeSlot());
        assertEquals("Concierge staff unavailable in morning", appointment.getRescheduleReason());
    }

    @Test
    void testCustomerCannotAcceptOwnProposal() {
        appointment.setRescheduleStatus(RescheduleStatus.PENDING_ADMIN);
        appointment.setProposedDate(LocalDate.now().plusDays(3));
        appointment.setProposedTimeSlot("01:00 PM - 02:00 PM");
        appointment.setRescheduleReason("Need afternoon");

        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));

        assertThrows(ForbiddenException.class, () -> appointmentServiceInstance.acceptReschedule(100L, customerPrincipal));
    }

    @Test
    void testCustomerAcceptsStaffProposalUpdatesSchedule() {
        appointment.setRescheduleStatus(RescheduleStatus.PENDING_CUSTOMER);
        LocalDate newDate = LocalDate.now().plusDays(5);
        appointment.setProposedDate(newDate);
        appointment.setProposedTimeSlot("03:00 PM - 04:00 PM");
        appointment.setRescheduleReason("Staff adjustment");

        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentResponse res = appointmentServiceInstance.acceptReschedule(100L, customerPrincipal);

        assertEquals(newDate, appointment.getDate());
        assertEquals("03:00 PM - 04:00 PM", appointment.getTimeSlot());
        assertEquals(AppointmentStatus.APPROVED, appointment.getStatus());
        assertEquals(RescheduleStatus.NONE, appointment.getRescheduleStatus());
        assertNull(appointment.getProposedDate());
        verify(appointmentRescheduleHistoryRepository).save(any());
    }

    @Test
    void testStaffCompletesAppointmentUnlocksReservation() {
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentResponse res = appointmentServiceInstance.completeAppointment(100L, staffPrincipal);

        assertEquals(AppointmentStatus.COMPLETED, appointment.getStatus());
        verify(notificationService).createNotification(eq(customer), any(), contains("Viewing Completed"), any());
    }

    @Test
    void testCannotCompleteAppointmentWithPendingReschedule() {
        appointment.setRescheduleStatus(RescheduleStatus.PENDING_CUSTOMER);
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));

        assertThrows(BadRequestException.class, () -> appointmentServiceInstance.completeAppointment(100L, staffPrincipal));
    }
}
