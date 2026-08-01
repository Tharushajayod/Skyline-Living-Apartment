package com.skyline.entity;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new LinkedHashSet<>();

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;
    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;
    @Column(name = "phone_number", length = 30)
    private String phone;
    @Column(name = "account_status", nullable = false, length = 30)
    private String status;
    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public User() {}
    public Long getUserId(){return userId;} public void setUserId(Long v){userId=v;}
    @Transient public Role getRole(){ return roles.stream().findFirst().orElse(null); }
    public void setRole(Role role){ roles.clear(); if(role!=null) roles.add(role); }
    public Set<Role> getRoles(){return roles;} public void setRoles(Set<Role> v){roles=v==null?new LinkedHashSet<>():v;}
    public String getFullName(){return fullName;} public void setFullName(String v){fullName=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String v){passwordHash=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public String getProfileImageUrl(){return profileImageUrl;} public void setProfileImageUrl(String v){profileImageUrl=v;}
    public boolean isEmailVerified(){return emailVerified;} public void setEmailVerified(boolean v){emailVerified=v;}
    public LocalDateTime getLastLoginAt(){return lastLoginAt;} public void setLastLoginAt(LocalDateTime v){lastLoginAt=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
    public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime v){updatedAt=v;}

    @PrePersist public void beforeInsert(){
        LocalDateTime now=LocalDateTime.now();
        if(createdAt==null) createdAt=now; if(updatedAt==null) updatedAt=now;
        if(status==null||status.isBlank()) status="ACTIVE";
    }
    @PreUpdate public void beforeUpdate(){updatedAt=LocalDateTime.now();}
}
