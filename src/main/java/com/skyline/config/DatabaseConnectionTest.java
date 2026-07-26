package com.skyline.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;

import javax.sql.DataSource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseConnectionTest implements CommandLineRunner {

    private final DataSource dataSource;

    public DatabaseConnectionTest(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        try (Connection connection = dataSource.getConnection()) {

            DatabaseMetaData metadata = connection.getMetaData();

            System.out.println("====================================");
            System.out.println("DATABASE CONNECTION SUCCESSFUL");
            System.out.println("Database name: " + connection.getCatalog());
            System.out.println(
                "Database product: " + metadata.getDatabaseProductName()
            );
            System.out.println(
                "Database version: " + metadata.getDatabaseProductVersion()
            );
            System.out.println("====================================");

        } catch (Exception exception) {

            System.err.println("====================================");
            System.err.println("DATABASE CONNECTION FAILED");
            System.err.println(exception.getMessage());
            System.err.println("====================================");

            throw new IllegalStateException(
                "Could not connect to SQL Server",
                exception
            );
        }
    }
}