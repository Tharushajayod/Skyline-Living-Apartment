package com.skyline.service;

import com.skyline.dto.appointment.AppointmentRequest;
import com.skyline.dto.appointment.AppointmentRescheduleHistoryResponse;
import com.skyline.dto.appointment.AppointmentResponse;
import com.skyline.dto.appointment.AppointmentStatusUpdate;
import com.skyline.entity.Apartment;
import com.skyline.entity.ApartmentStatus;
import com.skyline.entity.Appointment;
import com.skyline.entity.AppointmentRescheduleHistory;
import com.skyline.entity.User;
import com.skyline.enums.AppointmentStatus;
import com.skyline.enums.NotificationType;
import com.skyline.enums.UserRole;
import com.skyline.exception.BadRequestException;
import com.skyline.exception.ConflictException;
import com.skyline.exception.ForbiddenException;
import com.skyline.exception.ResourceNotFoundException;
import com.skyline.observer.NotificationEvent;
import com.skyline.observer.NotificationSubject;
import com.skyline.repository.AppointmentRepository;
import com.skyline.repository.AppointmentRescheduleHistoryRepository;
import com.skyline.security.UserPrincipal;
import com.skyline.strategy.appointment.*;
import com.skyline.util.IdParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentRescheduleHistoryRepository appointmentRescheduleHistoryRepository;
    private final ApartmentService apartmentService;
    private final UserService userService;
    private final NotificationSubject notificationSubject;
    private final AppointmentStatusStrategyContext appointmentStatusStrategyContext;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              AppointmentRescheduleHistoryRepository appointmentRescheduleHistoryRepository,
                              ApartmentService apartmentService,
                              UserService userService,
                              NotificationSubject notificationSubject) {
        this(appointmentRepository, appointmentRescheduleHistoryRepository, apartmentService, userService, notificationSubject,
                new AppointmentStatusStrategyContext(List.of(
                        new ApproveAppointmentStrategy(appointmentRepository, notificationSubject),
                        new RejectAppointmentStrategy(appointmentRepository, notificationSubject),
                        new CancelAppointmentStrategy(appointmentRepository, notificationSubject),
                        new CompleteAppointmentStrategy(appointmentRepository, notificationSubject),
                        new RescheduleAppointmentStrategy(appointmentRepository, notificationSubject)
                )));
    }

    public AppointmentService(AppointmentRepository appointmentRepository,
                              AppointmentRescheduleHistoryRepository appointmentRescheduleHistoryRepository,
                              ApartmentService apartmentService,
                              UserService userService,
                              NotificationSubject notificationSubject,
                              AppointmentStatusStrategyContext appointmentStatusStrategyContext) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentRescheduleHistoryRepository = appointmentRescheduleHistoryRepository;
        this.apartmentService = apartmentService;
        this.userService = userService;
        this.notificationSubject = notificationSubject;
        this.appointmentStatusStrategyContext = appointmentStatusStrategyContext;
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointments(UserPrincipal principal, String customerParam) {
        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (isStaffOrAdmin) {
            if (customerParam != null && !customerParam.trim().isEmpty()) {
                return appointmentRepository.findByCustomerEmailOrderByDateDesc(customerParam.trim()).stream()
                        .map(AppointmentResponse::fromEntity)
                        .collect(Collectors.toList());
            }
            return appointmentRepository.findAllWithDetails().stream()
                    .map(AppointmentResponse::fromEntity)
                    .collect(Collectors.toList());
        }

        // Customer sees only own appointments
        Long customerId = principal != null ? principal.getId() : null;
        if (customerId == null && customerParam != null) {
            return appointmentRepository.findByCustomerEmailOrderByDateDesc(customerParam.trim()).stream()
                    .map(AppointmentResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        if (customerId != null) {
            return appointmentRepository.findByCustomerIdWithDetails(customerId).stream()
                    .map(AppointmentResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    public List<AppointmentRescheduleHistoryResponse> getAppointmentHistory(Long appointmentId) {
        return appointmentRescheduleHistoryRepository.findByAppointmentIdOrderByCreatedAtDesc(appointmentId).stream()
                .map(AppointmentRescheduleHistoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public static final java.time.ZoneId APP_ZONE = java.time.ZoneId.of("Asia/Colombo");

    public static void validateFutureDateTime(LocalDate date, String timeSlot) {
        if (date == null) {
            throw new BadRequestException("Please select a valid appointment date.");
        }
        LocalDate today = LocalDate.now(APP_ZONE);
        if (date.isBefore(today)) {
            throw new BadRequestException("Appointment date cannot be in the past.");
        }
        if (date.isEqual(today) && timeSlot != null && !timeSlot.trim().isEmpty()) {
            LocalTime slotStartTime = parseSlotStartTime(timeSlot);
            if (slotStartTime != null) {
                LocalDateTime slotDateTime = LocalDateTime.of(date, slotStartTime);
                LocalDateTime nowTime = LocalDateTime.now(APP_ZONE);
                if (slotDateTime.isBefore(nowTime)) {
                    throw new BadRequestException("The selected time slot (" + timeSlot + ") has already passed for today. Please choose a future time slot.");
                }
            }
        }
    }

    public static LocalTime parseSlotStartTime(String timeSlot) {
        try {
            String clean = timeSlot.trim();
            if (clean.contains("-")) {
                clean = clean.split("-")[0].trim();
            }
            DateTimeFormatter f1 = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);
            try {
                return LocalTime.parse(clean.toUpperCase(), f1);
            } catch (Exception e1) {
                DateTimeFormatter f2 = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);
                try {
                    return LocalTime.parse(clean.toUpperCase(), f2);
                } catch (Exception e2) {
                    return LocalTime.parse(clean);
                }
            }
        } catch (Exception ignored) {
            return null;
        }
    }

    @Transactional
    public AppointmentResponse createAppointment(UserPrincipal principal, AppointmentRequest request) {
        Long aptId = IdParser.parseId(request.getApartmentId());
        Apartment apartment = apartmentService.getApartmentEntityById(aptId);

        if (apartment.getStatus() == ApartmentStatus.SOLD) {
            throw new BadRequestException("Cannot book viewing for a sold apartment");
        }

        User customer;
        if (principal != null) {
            customer = principal.getUser();
        } else if (request.getCustomerEmail() != null) {
            customer = userService.getUserEntityByEmail(request.getCustomerEmail());
        } else {
            throw new BadRequestException("Authenticated customer or customer email is required");
        }

        LocalDate viewingDate;
        try {
            viewingDate = LocalDate.parse(request.getDate());
        } catch (Exception e) {
            throw new BadRequestException("Invalid date format. Expected YYYY-MM-DD");
        }

        validateFutureDateTime(viewingDate, request.getTimeSlot());

        // Rule: Same customer cannot have duplicate active appointments for the same apartment
        boolean hasActiveForSameApartment = appointmentRepository.existsByApartmentIdAndCustomerIdAndStatusIn(
                apartment.getId(),
                customer.getId(),
                Arrays.asList(AppointmentStatus.PENDING, AppointmentStatus.APPROVED, AppointmentStatus.RESCHEDULED)
        );
        if (hasActiveForSameApartment) {
            throw new ConflictException("You already have an active viewing appointment for this apartment. Please manage or complete your existing appointment.");
        }

        // Rule: Slot availability check (prevent double booking)
        boolean slotBooked = appointmentRepository.existsByApartmentIdAndDateAndTimeSlotAndStatusIn(
                apartment.getId(),
                viewingDate,
                request.getTimeSlot(),
                Arrays.asList(AppointmentStatus.PENDING, AppointmentStatus.APPROVED, AppointmentStatus.RESCHEDULED)
        );
        if (slotBooked) {
            throw new ConflictException("The time slot " + request.getTimeSlot() + " on " + viewingDate + " is already booked for this apartment. Please select another slot.");
        }

        String name = request.getCustomerName() != null && !request.getCustomerName().isEmpty()
                ? request.getCustomerName() : customer.getName();
        String email = request.getCustomerEmail() != null && !request.getCustomerEmail().isEmpty()
                ? request.getCustomerEmail() : customer.getEmail();
        String phone = request.getCustomerPhone() != null && !request.getCustomerPhone().isEmpty()
                ? request.getCustomerPhone() : customer.getPhone();

        Appointment appointment = Appointment.builder()
                .apartment(apartment)
                .customer(customer)
                .customerName(name)
                .customerEmail(email)
                .customerPhone(phone)
                .date(viewingDate)
                .timeSlot(request.getTimeSlot())
                .status(AppointmentStatus.PENDING)
                .notes(request.getNotes() != null ? request.getNotes() : "")
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        // Notify customer
        notificationSubject.notifyObservers(new NotificationEvent(
                customer,
                NotificationType.APPOINTMENT,
                "Viewing Appointment Requested",
                "Your viewing request for " + apartment.getTitle() + " on " + viewingDate + " (" + request.getTimeSlot() + ") has been submitted."
        ));

        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional
    public AppointmentResponse proposeReschedule(Long id, com.skyline.dto.appointment.RescheduleProposalRequest request, UserPrincipal principal) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Completed appointments cannot be rescheduled.");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.REJECTED) {
            throw new BadRequestException("Cancelled or declined appointments cannot be rescheduled.");
        }

        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new BadRequestException("A reason is mandatory for any reschedule proposal.");
        }

        LocalDate newDate;
        try {
            newDate = LocalDate.parse(request.getDate().trim());
        } catch (Exception e) {
            throw new BadRequestException("Invalid reschedule date format. Expected YYYY-MM-DD");
        }

        String newTimeSlot = request.getTimeSlot() != null ? request.getTimeSlot().trim() : "";
        if (newTimeSlot.isEmpty()) {
            throw new BadRequestException("Time slot is required for reschedule proposal.");
        }

        validateFutureDateTime(newDate, newTimeSlot);

        // Check slot availability for this apartment (excluding this current appointment's current slot)
        boolean slotTaken = appointmentRepository.existsByApartmentIdAndDateAndTimeSlotAndStatusIn(
                appointment.getApartment().getId(),
                newDate,
                newTimeSlot,
                Arrays.asList(AppointmentStatus.PENDING, AppointmentStatus.APPROVED)
        );
        if (slotTaken && (!newDate.equals(appointment.getDate()) || !newTimeSlot.equalsIgnoreCase(appointment.getTimeSlot()))) {
            throw new ConflictException("The time slot " + newTimeSlot + " on " + newDate + " is already booked for this apartment.");
        }

        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (!isStaffOrAdmin) {
            // Customer proposing reschedule
            if (principal == null || !appointment.getCustomer().getId().equals(principal.getId())) {
                throw new ForbiddenException("You can only propose reschedules for your own appointments.");
            }
            appointment.setRescheduleStatus(com.skyline.enums.RescheduleStatus.PENDING_ADMIN);
            appointment.setRescheduleRequestedBy(principal.getUser().getName());
            appointment.setRescheduleRequestedByRole(UserRole.CUSTOMER);
        } else {
            // Staff/Admin proposing reschedule
            appointment.setRescheduleStatus(com.skyline.enums.RescheduleStatus.PENDING_CUSTOMER);
            appointment.setRescheduleRequestedBy(principal != null ? principal.getUser().getName() : "Skyline Concierge");
            appointment.setRescheduleRequestedByRole(principal != null ? principal.getUser().getRole() : UserRole.STAFF);

            // Notify customer of incoming proposal
            notificationSubject.notifyObservers(new NotificationEvent(
                    appointment.getCustomer(),
                    NotificationType.APPOINTMENT,
                    "Viewing Reschedule Proposed",
                    "Skyline team has proposed a new viewing time for " + appointment.getApartment().getTitle() + ": "
                            + newDate + " at " + newTimeSlot + ". Reason: " + request.getReason().trim() + ". Please review and respond in your appointments."
            ));
        }

        appointment.setProposedDate(newDate);
        appointment.setProposedTimeSlot(newTimeSlot);
        appointment.setRescheduleReason(request.getReason().trim());
        appointment.setRescheduleRequestedAt(LocalDateTime.now());

        Appointment saved = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional
    public AppointmentResponse acceptReschedule(Long id, UserPrincipal principal) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        if (appointment.getRescheduleStatus() == com.skyline.enums.RescheduleStatus.NONE || appointment.getProposedDate() == null) {
            throw new BadRequestException("There is no active reschedule request for this appointment.");
        }

        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        // Authorization check: only the receiving party can accept
        if (appointment.getRescheduleStatus() == com.skyline.enums.RescheduleStatus.PENDING_CUSTOMER) {
            if (isStaffOrAdmin && (principal == null || !principal.getId().equals(appointment.getCustomer().getId()))) {
                throw new ForbiddenException("Only the customer can accept an admin-proposed reschedule.");
            }
            if (principal != null && !appointment.getCustomer().getId().equals(principal.getId())) {
                throw new ForbiddenException("You cannot accept a reschedule proposal for another customer.");
            }
        } else if (appointment.getRescheduleStatus() == com.skyline.enums.RescheduleStatus.PENDING_ADMIN) {
            if (!isStaffOrAdmin) {
                throw new ForbiddenException("Only staff or admin can accept a customer-requested reschedule.");
            }
        }

        LocalDate newDate = appointment.getProposedDate();
        String newTimeSlot = appointment.getProposedTimeSlot();

        validateFutureDateTime(newDate, newTimeSlot);

        // Record history
        AppointmentRescheduleHistory history = AppointmentRescheduleHistory.builder()
                .appointment(appointment)
                .oldDate(appointment.getDate())
                .oldTimeSlot(appointment.getTimeSlot())
                .newDate(newDate)
                .newTimeSlot(newTimeSlot)
                .reason(appointment.getRescheduleReason() != null ? appointment.getRescheduleReason() : "Accepted proposed reschedule")
                .changedBy(principal != null ? principal.getUser().getName() : "System")
                .changedByRole(principal != null ? principal.getUser().getRole() : UserRole.CUSTOMER)
                .createdAt(LocalDateTime.now())
                .build();
        appointmentRescheduleHistoryRepository.save(history);

        // Update appointment schedule to accepted new slot
        appointment.setDate(newDate);
        appointment.setTimeSlot(newTimeSlot);
        appointment.setStatus(AppointmentStatus.APPROVED);
        
        // Clear proposal
        appointment.setRescheduleStatus(com.skyline.enums.RescheduleStatus.NONE);
        appointment.setProposedDate(null);
        appointment.setProposedTimeSlot(null);
        appointment.setRescheduleReason(null);
        appointment.setRescheduleRequestedBy(null);
        appointment.setRescheduleRequestedByRole(null);
        appointment.setRescheduleRequestedAt(null);

        Appointment saved = appointmentRepository.save(appointment);

        // Send confirmation notification
        notificationSubject.notifyObservers(new NotificationEvent(
                appointment.getCustomer(),
                NotificationType.APPOINTMENT,
                "Viewing Reschedule Confirmed",
                "Your viewing appointment for " + appointment.getApartment().getTitle() + " is now confirmed for "
                        + newDate + " (" + newTimeSlot + ")."
        ));

        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional
    public AppointmentResponse rejectReschedule(Long id, String reason, UserPrincipal principal) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        if (appointment.getRescheduleStatus() == com.skyline.enums.RescheduleStatus.NONE) {
            throw new BadRequestException("There is no active reschedule request to reject.");
        }

        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (!isStaffOrAdmin && (principal == null || !appointment.getCustomer().getId().equals(principal.getId()))) {
            throw new ForbiddenException("You cannot decline a reschedule request for another customer.");
        }

        // Clear proposal and return appointment to active state with existing date/time
        appointment.setRescheduleStatus(com.skyline.enums.RescheduleStatus.NONE);
        appointment.setProposedDate(null);
        appointment.setProposedTimeSlot(null);
        appointment.setRescheduleReason(null);
        appointment.setRescheduleRequestedBy(null);
        appointment.setRescheduleRequestedByRole(null);
        appointment.setRescheduleRequestedAt(null);

        Appointment saved = appointmentRepository.save(appointment);

        notificationSubject.notifyObservers(new NotificationEvent(
                appointment.getCustomer(),
                NotificationType.APPOINTMENT,
                "Reschedule Request Declined",
                "The reschedule proposal for " + appointment.getApartment().getTitle()
                        + " was declined. Your viewing remains scheduled for " + appointment.getDate() + " (" + appointment.getTimeSlot() + ")."
        ));

        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional
    public AppointmentResponse completeAppointment(Long id, UserPrincipal principal) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        boolean isStaffOrAdmin = principal != null && (
                principal.getUser().getRole() == UserRole.STAFF ||
                principal.getUser().getRole() == UserRole.ADMIN);

        if (!isStaffOrAdmin) {
            throw new ForbiddenException("Only authorized staff or administrators can mark an appointment as completed.");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            return AppointmentResponse.fromEntity(appointment);
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.REJECTED) {
            throw new BadRequestException("Cannot complete a cancelled or declined appointment.");
        }

        if (appointment.getRescheduleStatus() != com.skyline.enums.RescheduleStatus.NONE) {
            throw new BadRequestException("Cannot complete an appointment with a pending reschedule request. Please resolve the reschedule first.");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        Appointment saved = appointmentRepository.save(appointment);

        // Notify customer of unlock
        notificationSubject.notifyObservers(new NotificationEvent(
                appointment.getCustomer(),
                NotificationType.APPOINTMENT,
                "Viewing Completed - Reservation Available!",
                "Your viewing tour for " + appointment.getApartment().getTitle() + " is marked as Completed. You are now eligible to place a reservation hold on this apartment."
        ));

        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional
    public AppointmentResponse updateStatus(Long id, AppointmentStatusUpdate update, UserPrincipal principal) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        // Strategy Pattern: polymorphic execution of status transition strategy
        return appointmentStatusStrategyContext.executeStrategy(appointment, update, principal);
    }
}
