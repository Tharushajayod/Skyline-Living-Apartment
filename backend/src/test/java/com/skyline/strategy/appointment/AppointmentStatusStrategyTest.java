package com.skyline.strategy.appointment;

import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.appointment.AppointmentStatusUpdate;
import com.skyline.entity.Apartment;
import com.skyline.entity.Appointment;
import com.skyline.entity.User;
import com.skyline.enums.AppointmentStatus;
import com.skyline.enums.RescheduleStatus;
import com.skyline.enums.UserRole;
import com.skyline.observer.NotificationEvent;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.AppointmentRepository;
import com.skyline.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentStatusStrategyTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private NotificationSubject notificationSubject;

    private AppointmentStatusStrategyContext strategyContext;

    private User customer;
    private User staff;
    private UserPrincipal customerPrincipal;
    private UserPrincipal staffPrincipal;
    private Apartment apartment;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        customer = User.builder().id(101L).name("Sarah Chen").email("sarah@email.com").role(UserRole.CUSTOMER).build();
        staff = User.builder().id(201L).name("Alex Staff").email("alex@skyline.com").role(UserRole.STAFF).build();
        customerPrincipal = new UserPrincipal(customer);
        staffPrincipal = new UserPrincipal(staff);

        apartment = Apartment.builder().id(1L).title("Skyline Penthouse").price(new java.math.BigDecimal("25000000")).build();
        appointment = Appointment.builder()
                .id(501L)
                .customer(customer)
                .apartment(apartment)
                .date(LocalDate.now().plusDays(2))
                .timeSlot("10:00 AM - 11:00 AM")
                .status(AppointmentStatus.PENDING)
                .rescheduleStatus(RescheduleStatus.NONE)
                .build();

        strategyContext = new AppointmentStatusStrategyContext(List.of(
                new ApproveAppointmentStrategy(appointmentRepository, notificationSubject),
                new RejectAppointmentStrategy(appointmentRepository, notificationSubject),
                new CancelAppointmentStrategy(appointmentRepository, notificationSubject),
                new CompleteAppointmentStrategy(appointmentRepository, notificationSubject),
                new RescheduleAppointmentStrategy(appointmentRepository, notificationSubject)
        ));
    }

    @Test
    @DisplayName("Strategy Pattern: ApproveAppointmentStrategy executes approval by staff")
    void testApproveStrategy() {
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentStatusUpdate update = AppointmentStatusUpdate.builder().status(AppointmentStatus.APPROVED).build();
        AppointmentResponse response = strategyContext.executeStrategy(appointment, update, staffPrincipal);

        assertEquals(AppointmentStatus.APPROVED, appointment.getStatus());
        assertEquals(AppointmentStatus.APPROVED, response.getStatus());
        verify(notificationSubject, times(1)).notifyObservers(any(NotificationEvent.class));
    }

    @Test
    @DisplayName("Strategy Pattern: RejectAppointmentStrategy executes rejection by staff")
    void testRejectStrategy() {
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentStatusUpdate update = AppointmentStatusUpdate.builder().status(AppointmentStatus.REJECTED).build();
        AppointmentResponse response = strategyContext.executeStrategy(appointment, update, staffPrincipal);

        assertEquals(AppointmentStatus.REJECTED, appointment.getStatus());
        assertEquals(AppointmentStatus.REJECTED, response.getStatus());
        verify(notificationSubject, times(1)).notifyObservers(any(NotificationEvent.class));
    }

    @Test
    @DisplayName("Strategy Pattern: CancelAppointmentStrategy executes cancellation by customer")
    void testCancelStrategy() {
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentStatusUpdate update = AppointmentStatusUpdate.builder().status(AppointmentStatus.CANCELLED).build();
        AppointmentResponse response = strategyContext.executeStrategy(appointment, update, customerPrincipal);

        assertEquals(AppointmentStatus.CANCELLED, appointment.getStatus());
        assertEquals(AppointmentStatus.CANCELLED, response.getStatus());
        verify(notificationSubject, times(1)).notifyObservers(any(NotificationEvent.class));
    }

    @Test
    @DisplayName("Strategy Pattern: CompleteAppointmentStrategy unlocks reservation for customer")
    void testCompleteStrategy() {
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentStatusUpdate update = AppointmentStatusUpdate.builder().status(AppointmentStatus.COMPLETED).build();
        AppointmentResponse response = strategyContext.executeStrategy(appointment, update, staffPrincipal);

        assertEquals(AppointmentStatus.COMPLETED, appointment.getStatus());
        assertEquals(AppointmentStatus.COMPLETED, response.getStatus());
        verify(notificationSubject, times(1)).notifyObservers(any(NotificationEvent.class));
    }
}
