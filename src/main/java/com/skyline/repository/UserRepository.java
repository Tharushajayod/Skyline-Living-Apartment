package com.skyline.repository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.skyline.entity.User;
public interface UserRepository extends JpaRepository<User,Long>{
 Optional<User> findByEmail(String email);
 boolean existsByEmail(String email);
 @Query("select u from User u where lower(u.status)=lower(:status)") List<User> findByStatus(@Param("status") String status);
 @Query("select distinct u from User u join u.roles r where lower(r.roleName)=lower(:roleName)") List<User> findByRoleRoleName(@Param("roleName") String roleName);
 List<User> findAllByOrderByCreatedAtDesc();
 @Query("select count(distinct u) from User u join u.roles r where lower(r.roleName)=lower(:roleName)") long countByRoleRoleName(@Param("roleName") String roleName);
 @Query("select count(u) from User u where lower(u.status)=lower(:status)") long countByStatus(@Param("status") String status);
}
