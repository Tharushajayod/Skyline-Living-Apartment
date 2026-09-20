package com.skyline;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SkylineApartmentApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkylineApartmentApplication.class, args);
    }
}