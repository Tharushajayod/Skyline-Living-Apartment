package com.skyline.entity;
import java.time.LocalDateTime;
import jakarta.persistence.*;
@Entity @Table(name="roles")
public class Role {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="role_id") private Long roleId;
 @Column(name="role_name",nullable=false,unique=true,length=50) private String roleName;
 @Column(name="description",length=255) private String description;
 @Column(name="created_at",nullable=false) private LocalDateTime createdAt;
 @Column(name="updated_at",nullable=false) private LocalDateTime updatedAt;
 public Role(){}
 public Long getRoleId(){return roleId;} public void setRoleId(Long v){roleId=v;}
 public String getRoleName(){return roleName;} public void setRoleName(String v){roleName=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
 public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime v){updatedAt=v;}
 @PrePersist void prePersist(){LocalDateTime n=LocalDateTime.now(); if(createdAt==null)createdAt=n; if(updatedAt==null)updatedAt=n;}
 @PreUpdate void preUpdate(){updatedAt=LocalDateTime.now();}
}
