package com.skyline.dto.user;

import com.skyline.entity.User;
import com.skyline.enums.UserRole;
import com.skyline.enums.UserStatus;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private String id;
    private String name;
    private String email;
    private String phone;
    private UserRole role;
    private String avatarUrl;
    private LocalDateTime createdAt;
    private UserStatus status;

    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(IdParser.formatId("USR", user.getId()))
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone() != null ? user.getPhone() : "")
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl() != null ? user.getAvatarUrl() : "")
                .createdAt(user.getCreatedAt())
                .status(user.getStatus())
                .build();
    }
}
