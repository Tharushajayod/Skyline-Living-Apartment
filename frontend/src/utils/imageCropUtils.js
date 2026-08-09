const createImage = (imageUrl) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => {
      resolve(image);
    });

    image.addEventListener("error", (error) => {
      reject(error);
    });

    image.src = imageUrl;
  });

const getFileExtension = (mimeType) => {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
};

export const createCroppedImageFile = async (
  imageUrl,
  cropPixels,
  originalFile
) => {
  const image = await createImage(imageUrl);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Unable to create the image crop."
    );
  }

  const outputSize = 600;

  canvas.width = outputSize;
  canvas.height = outputSize;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    outputSize,
    outputSize
  );

  const mimeType =
    originalFile?.type === "image/png"
      ? "image/png"
      : "image/jpeg";

  const blob = await new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(
              new Error(
                "Unable to create the cropped image."
              )
            );
          }
        },
        mimeType,
        0.92
      );
    }
  );

  const extension =
    getFileExtension(mimeType);

  return new File(
    [blob],
    `profile-image-${Date.now()}.${extension}`,
    {
      type: mimeType,
      lastModified: Date.now(),
    }
  );
};