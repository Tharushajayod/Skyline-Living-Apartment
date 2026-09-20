package com.skyline.dto.apartment;

import com.skyline.entity.ApartmentImage;
import com.skyline.util.IdParser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentImageDto {
    private String id;
    private String url;
    private String caption;

    public static ApartmentImageDto fromEntity(ApartmentImage image) {
        if (image == null) return null;
        return ApartmentImageDto.builder()
                .id(image.getId() != null ? IdParser.formatId("img", image.getId()) : "")
                .url(image.getUrl())
                .caption(image.getCaption() != null ? image.getCaption() : "")
                .build();
    }
}
