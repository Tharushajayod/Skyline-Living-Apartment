package com.skyline.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "staff")
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_id")
    private Long staffId;

    @OneToOne
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true
    )
    private User user;

    @Column(
            name = "employee_number",
            nullable = false,
            unique = true
    )
    private String employeeNumber;

    @Column(name = "department")
    private String department;

    @Column(name = "position", nullable = false)
    private String designation;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "staff_status", nullable = false)
    private String staffStatus = "ACTIVE";

    @Column(name = "created_at", nullable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private java.time.LocalDateTime updatedAt;

    public Staff() {
    }

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getEmployeeNumber() {
        return employeeNumber;
    }

    public void setEmployeeNumber(
            String employeeNumber
    ) {
        this.employeeNumber = employeeNumber;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(
            String department
    ) {
        this.department = department;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(
            String designation
    ) {
        this.designation = designation;
    }

    public LocalDate getHireDate() {
        return hireDate;
    }

    public void setHireDate(
            LocalDate hireDate
    ) {
        this.hireDate = hireDate;
    }
    public String getStaffStatus(){ return staffStatus; }
    public void setStaffStatus(String v){ staffStatus=v; }
    @jakarta.persistence.PrePersist public void prePersist(){ java.time.LocalDateTime n=java.time.LocalDateTime.now(); if(createdAt==null)createdAt=n; if(updatedAt==null)updatedAt=n; if(staffStatus==null||staffStatus.isBlank())staffStatus="ACTIVE"; }
    @jakarta.persistence.PreUpdate public void preUpdate(){ updatedAt=java.time.LocalDateTime.now(); }
}
