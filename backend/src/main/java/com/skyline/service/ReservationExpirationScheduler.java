package com.skyline.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReservationExpirationScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReservationExpirationScheduler.class);

    private final ReservationService reservationService;

    public ReservationExpirationScheduler(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    // Run every 60 seconds to check for expired 4-day reservation holds
    @Scheduled(fixedRate = 60000)
    public void checkExpiredReservations() {
        try {
            reservationService.expireOverdueReservations();
        } catch (Exception e) {
            log.error("Error during reservation expiration check: {}", e.getMessage(), e);
        }
    }
}
