package com.skyline.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.skyline.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "inquiry_replies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InquiryReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquiry_id", nullable = false)
    @JsonIgnore
    private Inquiry inquiry;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    private String authorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole authorRole;

    @Column(nullable = false, length = 4000)
    private String message;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
