import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { motion } from "motion/react";
import Cropper from "react-easy-crop";

import {
  CameraAltRounded,
  CloseRounded,
  DeleteOutlineRounded,
  EditRounded,
  LockResetRounded,
  SaveRounded,
  VisibilityOffRounded,
  VisibilityRounded,
  ZoomInRounded,
} from "@mui/icons-material";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import userService from "../../services/userService";

import {
  createCroppedImageFile,
} from "../../utils/imageCropUtils";

import { useAuth } from "../../contexts/AuthContext";

const MotionCard = motion.create(Card);

const glassCard = {
  borderRadius: "24px",

  background:
    "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.86))",

  backdropFilter: "blur(22px)",

  border:
    "1px solid rgba(255,255,255,0.96)",

  boxShadow:
    "0 14px 40px rgba(53,79,108,0.08)",

  overflow: "hidden",
};

const sriLankanCities = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Balangoda",
  "Bandarawela",
  "Batticaloa",
  "Beruwala",
  "Chilaw",
  "Colombo",
  "Dambulla",
  "Dehiwala-Mount Lavinia",
  "Embilipitiya",
  "Galle",
  "Gampaha",
  "Gampola",
  "Hambantota",
  "Hatton",
  "Hikkaduwa",
  "Horana",
  "Ja-Ela",
  "Jaffna",
  "Kadawatha",
  "Kalmunai",
  "Kalutara",
  "Kandy",
  "Kattankudy",
  "Katunayake",
  "Kegalle",
  "Kelaniya",
  "Kilinochchi",
  "Kolonnawa",
  "Kurunegala",
  "Maharagama",
  "Mannar",
  "Matale",
  "Matara",
  "Minuwangoda",
  "Monaragala",
  "Moratuwa",
  "Mullaitivu",
  "Negombo",
  "Nugegoda",
  "Nuwara Eliya",
  "Panadura",
  "Peliyagoda",
  "Point Pedro",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Sri Jayawardenepura Kotte",
  "Tangalle",
  "Trincomalee",
  "Vavuniya",
  "Wattala",
  "Weligama",
];

const contactMethods = [
  {
    value: "EMAIL",
    label: "Email",
  },
  {
    value: "PHONE",
    label: "Phone Call",
  },
  {
    value: "SMS",
    label: "SMS",
  },
  {
    value: "WHATSAPP",
    label: "WhatsApp",
  },
  {
    value: "TELEGRAM",
    label: "Telegram",
  },
];

const ProfilePage = () => {
    const { updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);

  const [profileImageSrc, setProfileImageSrc] =
    useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    nicPassportNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    preferredContactMethod: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    });

  const [
    showCurrentPassword,
    setShowCurrentPassword,
    ] = useState(false);

    const [
    showNewPassword,
    setShowNewPassword,
    ] = useState(false);

    const [
    showConfirmPassword,
    setShowConfirmPassword,
    ] = useState(false);

  const [editMode, setEditMode] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    uploadingImage,
    setUploadingImage,
  ] = useState(false);

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /*
   * Crop dialog states
   */
  const [cropDialogOpen, setCropDialogOpen] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [
    croppedAreaPixels,
    setCroppedAreaPixels,
  ] = useState(null);

  const fillForm = useCallback((data) => {
    setFormData({
      fullName: data?.fullName || "",

      phone: data?.phone || "",

      nicPassportNumber:
        data?.nicPassportNumber || "",

      addressLine1:
        data?.addressLine1 || "",

      addressLine2:
        data?.addressLine2 || "",

      city: data?.city || "",

      preferredContactMethod:
        data?.preferredContactMethod || "",
    });
  }, []);

  const loadProtectedProfileImage =
    useCallback(async (fileUrl) => {
      if (!fileUrl) {
        setProfileImageSrc("");
        return;
      }

      try {
        const blob =
          await userService.getProtectedImage(
            fileUrl
          );

        const objectUrl =
          URL.createObjectURL(blob);

        setProfileImageSrc((currentUrl) => {
          if (
            currentUrl &&
            currentUrl.startsWith("blob:")
          ) {
            URL.revokeObjectURL(
              currentUrl
            );
          }

          return objectUrl;
        });
      } catch (error) {
        console.error(
          "Unable to load profile image:",
          error
        );

        setProfileImageSrc("");
      }
    }, []);

  const loadProfile = useCallback(
    async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const data =
          await userService.getMyProfile();

        setProfile(data);

        fillForm(data);

        await loadProtectedProfileImage(
          data?.profileImageUrl
        );
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message ||
            "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      fillForm,
      loadProtectedProfileImage,
    ]
  );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    return () => {
      if (
        profileImageSrc &&
        profileImageSrc.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          profileImageSrc
        );
      }

      if (
        selectedImage &&
        selectedImage.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          selectedImage
        );
      }
    };
  }, [profileImageSrc, selectedImage]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!formData.fullName.trim()) {
      setErrorMessage(
        "Full name is required."
      );

      return;
    }

    try {
      setSaving(true);

      setSuccessMessage("");
      setErrorMessage("");

      const updatedProfile =
        await userService.updateMyProfile({
          fullName:
            formData.fullName.trim(),

          phone:
            formData.phone.trim(),

          nicPassportNumber:
            formData.nicPassportNumber.trim(),

          addressLine1:
            formData.addressLine1.trim(),

          addressLine2:
            formData.addressLine2.trim(),

          city: formData.city,

          preferredContactMethod:
            formData.preferredContactMethod,
        });

      setProfile(updatedProfile);
        fillForm(updatedProfile);

        updateUser({
        fullName: updatedProfile?.fullName,
        email: updatedProfile?.email,
        profileImageUrl:
            updatedProfile?.profileImageUrl,
        });

        setEditMode(false);

      setSuccessMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Called when the user selects an image
   * from the Windows file picker.
   */
  const handleImageSelected = (event) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        "Please select a JPG, PNG or WEBP image."
      );

      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrorMessage(
        "The selected image must be smaller than 10 MB."
      );

      return;
    }

    if (
      selectedImage &&
      selectedImage.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        selectedImage
      );
    }

    const objectUrl =
      URL.createObjectURL(file);

    setSelectedFile(file);
    setSelectedImage(objectUrl);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setCroppedAreaPixels(null);

    setCropDialogOpen(true);
    setErrorMessage("");
  };

  const handleCropComplete = useCallback(
    (_croppedArea, croppedPixels) => {
      setCroppedAreaPixels(
        croppedPixels
      );
    },
    []
  );

  const handleCloseCropDialog = () => {
    if (!uploadingImage) {
      setCropDialogOpen(false);

      if (
        selectedImage &&
        selectedImage.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          selectedImage
        );
      }

      setSelectedImage("");
      setSelectedFile(null);
      setCroppedAreaPixels(null);
    }
  };

  const handleUploadCroppedImage =
    async () => {
      if (
        !selectedImage ||
        !selectedFile ||
        !croppedAreaPixels
      ) {
        setErrorMessage(
          "Please select and crop an image."
        );

        return;
      }

      try {
        setUploadingImage(true);

        setSuccessMessage("");
        setErrorMessage("");

        const croppedFile =
          await createCroppedImageFile(
            selectedImage,
            croppedAreaPixels,
            selectedFile
          );

        await userService.uploadProfileImage(
          croppedFile
        );

        setCropDialogOpen(false);

        if (
          selectedImage.startsWith("blob:")
        ) {
          URL.revokeObjectURL(
            selectedImage
          );
        }

        setSelectedImage("");
        setSelectedFile(null);
        setCroppedAreaPixels(null);

        await loadProfile();

        updateUser({
        profileImageUrl: `updated-${Date.now()}`,
        });

        setSuccessMessage(
          "Profile picture updated successfully."
        );
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message ||
            error.message ||
            "Unable to upload profile picture."
        );
      } finally {
        setUploadingImage(false);
      }
    };

  const handleRemoveImage = async () => {
    try {
      setUploadingImage(true);

      setSuccessMessage("");
      setErrorMessage("");

      await userService.removeProfileImage();

      setProfile((current) => ({
        ...current,
        profileImageUrl: null,
      }));

      if (
        profileImageSrc &&
        profileImageSrc.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          profileImageSrc
        );
      }

      setProfileImageSrc("");

      setSuccessMessage(
        "Profile picture removed successfully."
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to remove profile picture."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePasswordChange = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!passwordData.currentPassword) {
        setErrorMessage(
        "Current password is required."
        );
        return;
    }

    if (!passwordData.newPassword) {
        setErrorMessage(
        "New password is required."
        );
        return;
    }

    if (passwordData.newPassword.length < 8) {
        setErrorMessage(
        "New password must contain at least 8 characters."
        );
        return;
    }

    const strongPasswordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,100}$/;

    if (
    !strongPasswordPattern.test(
        passwordData.newPassword
    )
    ) {
    setErrorMessage(
        "Password must contain uppercase, lowercase, number and special character."
    );

    return;
    }

    if (
        passwordData.newPassword !==
        passwordData.confirmPassword
    ) {
        setErrorMessage(
        "New password and confirm password do not match."
        );
        return;
    }

    if (
        passwordData.currentPassword ===
        passwordData.newPassword
    ) {
        setErrorMessage(
        "New password must be different from the current password."
        );
        return;
    }

    try {
        setChangingPassword(true);

        const response =
        await userService.changePassword({
            currentPassword:
            passwordData.currentPassword,

            newPassword:
            passwordData.newPassword,

            confirmPassword:
            passwordData.confirmPassword,
        });

        setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        });

        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);

        setSuccessMessage(
        response?.message ||
            "Password changed successfully."
        );
    } catch (error) {
        setErrorMessage(
        error.response?.data?.message ||
            "Unable to change your password."
        );
    } finally {
        setChangingPassword(false);
    }
    };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 420,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Stack
        spacing={3}
        sx={{
          maxWidth: 1350,
          mx: "auto",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={900}
            color="#172033"
          >
            My Profile
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.75 }}
          >
            Manage your personal information
            and account security.
          </Typography>
        </Box>

        {successMessage && (
          <Alert
            severity="success"
            onClose={() =>
              setSuccessMessage("")
            }
            sx={{
              borderRadius: "16px",
            }}
          >
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert
            severity="error"
            onClose={() =>
              setErrorMessage("")
            }
            sx={{
              borderRadius: "16px",
            }}
          >
            {errorMessage}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              lg: 4,
            }}
          >
            <MotionCard
              elevation={0}
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              sx={glassCard}
            >
              <CardContent
                sx={{
                  p: 3,
                  textAlign: "center",
                }}
              >
                <Avatar
                  src={
                    profileImageSrc ||
                    undefined
                  }
                  sx={{
                    width: 132,
                    height: 132,
                    mx: "auto",
                    mb: 2,
                    fontSize: 44,

                    background:
                      "linear-gradient(135deg, #2563eb, #60a5fa)",

                    boxShadow:
                      "0 16px 35px rgba(37,99,235,0.2)",
                  }}
                >
                  {profile?.fullName
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </Avatar>

                <Typography
                  variant="h6"
                  fontWeight={850}
                >
                  {profile?.fullName}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {profile?.email}
                </Typography>

                <Typography
                  variant="caption"
                  color="primary"
                  fontWeight={800}
                  sx={{
                    display: "inline-block",
                    mt: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 10,

                    backgroundColor:
                      "rgba(37,99,235,0.08)",
                  }}
                >
                  {profile?.roles?.join(
                    ", "
                  ) ||
                    profile?.role ||
                    "CUSTOMER"}
                </Typography>

                <Stack
                  spacing={1.25}
                  sx={{ mt: 3 }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    hidden
                    onChange={
                      handleImageSelected
                    }
                  />

                  <Button
                    variant="contained"
                    startIcon={
                      <CameraAltRounded />
                    }
                    disabled={
                      uploadingImage
                    }
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    sx={{
                      minHeight: 46,
                      borderRadius: "14px",

                      transition:
                        "all 180ms ease",

                      "&:active": {
                        transform:
                          "scale(0.97)",
                      },
                    }}
                  >
                    Change profile picture
                  </Button>

                  {profile?.profileImageUrl && (
                    <Button
                      color="error"
                      variant="outlined"
                      startIcon={
                        <DeleteOutlineRounded />
                      }
                      disabled={
                        uploadingImage
                      }
                      onClick={
                        handleRemoveImage
                      }
                      sx={{
                        minHeight: 44,
                        borderRadius:
                          "14px",
                      }}
                    >
                      Remove profile picture
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </MotionCard>
          </Grid>

          <Grid
            size={{
              xs: 12,
              lg: 8,
            }}
          >
            <Stack spacing={3}>
              <MotionCard
                elevation={0}
                initial={{
                  opacity: 0,
                  y: 16,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.08,
                }}
                sx={glassCard}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    justifyContent="space-between"
                    alignItems={{
                      xs: "flex-start",
                      sm: "center",
                    }}
                    spacing={2}
                    sx={{ mb: 3 }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={850}
                      >
                        Personal Information
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Keep your contact
                        details up to date.
                      </Typography>
                    </Box>

                    {!editMode && (
                      <Button
                        startIcon={
                          <EditRounded />
                        }
                        onClick={() =>
                          setEditMode(true)
                        }
                      >
                        Edit profile
                      </Button>
                    )}
                  </Stack>

                  <Grid
                    container
                    spacing={2.25}
                  >
                    <Grid
                      size={{
                        xs: 12,
                        sm: 6,
                      }}
                    >
                      <TextField
                        name="fullName"
                        label="Full Name"
                        fullWidth
                        value={
                          formData.fullName
                        }
                        disabled={!editMode}
                        onChange={
                          handleFieldChange
                        }
                      />
                    </Grid>

                    <Grid
                      size={{
                        xs: 12,
                        sm: 6,
                      }}
                    >
                      <TextField
                        label="Email"
                        fullWidth
                        value={
                          profile?.email ||
                          ""
                        }
                        disabled
                      />
                    </Grid>

                    <Grid
                      size={{
                        xs: 12,
                        sm: 6,
                      }}
                    >
                      <TextField
                        name="phone"
                        label="Phone Number"
                        fullWidth
                        value={formData.phone}
                        disabled={!editMode}
                        onChange={
                          handleFieldChange
                        }
                      />
                    </Grid>

                    <Grid
                      size={{
                        xs: 12,
                        sm: 6,
                      }}
                    >
                      <TextField
                        name="nicPassportNumber"
                        label="NIC / Passport Number"
                        fullWidth
                        value={
                          formData.nicPassportNumber
                        }
                        disabled={!editMode}
                        onChange={
                          handleFieldChange
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        name="addressLine1"
                        label="Address Line 1"
                        fullWidth
                        value={
                          formData.addressLine1
                        }
                        disabled={!editMode}
                        onChange={
                          handleFieldChange
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        name="addressLine2"
                        label="Address Line 2"
                        fullWidth
                        value={
                          formData.addressLine2
                        }
                        disabled={!editMode}
                        onChange={
                          handleFieldChange
                        }
                      />
                    </Grid>

                    <Grid
                      size={{
                        xs: 12,
                        sm: 6,
                      }}
                    >
                      <TextField
                        name="city"
                        label="City"
                        select
                        fullWidth
                        value={formData.city}
                        disabled={!editMode}
                        onChange={
                          handleFieldChange
                        }
                      >
                        <MenuItem value="">
                          Select city
                        </MenuItem>

                        {sriLankanCities.map(
                          (city) => (
                            <MenuItem
                              key={city}
                              value={city}
                            >
                              {city}
                            </MenuItem>
                          )
                        )}
                      </TextField>
                    </Grid>

                    <Grid
                      size={{
                        xs: 12,
                        sm: 6,
                      }}
                    >
                      <TextField
                        name="preferredContactMethod"
                        label="Preferred Contact Method"
                        select
                        fullWidth
                        value={
                          formData.preferredContactMethod
                        }
                        disabled={!editMode}
                        onChange={
                          handleFieldChange
                        }
                      >
                        <MenuItem value="">
                          Select contact method
                        </MenuItem>

                        {contactMethods.map(
                          (method) => (
                            <MenuItem
                              key={
                                method.value
                              }
                              value={
                                method.value
                              }
                            >
                              {method.label}
                            </MenuItem>
                          )
                        )}
                      </TextField>
                    </Grid>
                  </Grid>

                  {editMode && (
                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      justifyContent="flex-end"
                      spacing={1.5}
                      sx={{ mt: 3 }}
                    >
                      <Button
                        color="inherit"
                        disabled={saving}
                        onClick={() => {
                          fillForm(profile);

                          setEditMode(false);
                        }}
                      >
                        Cancel
                      </Button>

                      <Button
                        variant="contained"
                        startIcon={
                          <SaveRounded />
                        }
                        disabled={saving}
                        onClick={
                          handleSaveProfile
                        }
                      >
                        {saving
                          ? "Saving..."
                          : "Save changes"}
                      </Button>
                    </Stack>
                  )}
                </CardContent>
              </MotionCard>

              <MotionCard
                elevation={0}
                initial={{
                  opacity: 0,
                  y: 16,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.16,
                }}
                sx={glassCard}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,

                        display: "grid",
                        placeItems: "center",

                        borderRadius:
                          "14px",

                        color: "#7c3aed",

                        backgroundColor:
                          "rgba(124,58,237,0.09)",
                      }}
                    >
                      <LockResetRounded />
                    </Box>

                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={850}
                      >
                        Change Password
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Enter and confirm
                        your new password.
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ mb: 3 }} />

                  <Box
                        component="form"
                        autoComplete="off"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handlePasswordChange();
                        }}
                        >
                        <Grid
                            container
                            spacing={2.25}
                        >
                            {/* Current Password */}
                            <Grid size={{ xs: 12 }}>
                            <TextField
                                name="skylineCurrentPassword"
                                label="Current Password"
                                type={
                                showCurrentPassword
                                    ? "text"
                                    : "password"
                                }
                                fullWidth
                                value={
                                passwordData.currentPassword
                                }
                                onChange={(event) =>
                                setPasswordData(
                                    (current) => ({
                                    ...current,
                                    currentPassword:
                                        event.target.value,
                                    })
                                )
                                }
                                slotProps={{
                                htmlInput: {
                                    autoComplete: "new-password",
                                },

                                input: {
                                    endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                        edge="end"
                                        type="button"
                                        aria-label={
                                            showCurrentPassword
                                            ? "Hide current password"
                                            : "Show current password"
                                        }
                                        onClick={() =>
                                            setShowCurrentPassword(
                                            (current) =>
                                                !current
                                            )
                                        }
                                        >
                                        {showCurrentPassword ? (
                                            <VisibilityOffRounded />
                                        ) : (
                                            <VisibilityRounded />
                                        )}
                                        </IconButton>
                                    </InputAdornment>
                                    ),
                                },
                                }}
                            />
                            </Grid>

                            {/* New Password */}
                            <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                            }}
                            >
                            <TextField
                                name="skylineNewPassword"
                                label="New Password"
                                type={
                                showNewPassword
                                    ? "text"
                                    : "password"
                                }
                                fullWidth
                                value={
                                passwordData.newPassword
                                }
                                onChange={(event) =>
                                setPasswordData(
                                    (current) => ({
                                    ...current,
                                    newPassword:
                                        event.target.value,
                                    })
                                )
                                }
                                slotProps={{
                                htmlInput: {
                                    autoComplete: "new-password",
                                },

                                input: {
                                    endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                        edge="end"
                                        type="button"
                                        aria-label={
                                            showNewPassword
                                            ? "Hide new password"
                                            : "Show new password"
                                        }
                                        onClick={() =>
                                            setShowNewPassword(
                                            (current) =>
                                                !current
                                            )
                                        }
                                        >
                                        {showNewPassword ? (
                                            <VisibilityOffRounded />
                                        ) : (
                                            <VisibilityRounded />
                                        )}
                                        </IconButton>
                                    </InputAdornment>
                                    ),
                                },
                                }}
                            />
                            </Grid>

                            {/* Confirm New Password */}
                            <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                            }}
                            >
                            <TextField
                                name="skylineConfirmPassword"
                                label="Confirm New Password"
                                type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                                }
                                fullWidth
                                value={
                                passwordData.confirmPassword
                                }
                                onChange={(event) =>
                                setPasswordData(
                                    (current) => ({
                                    ...current,
                                    confirmPassword:
                                        event.target.value,
                                    })
                                )
                                }
                                slotProps={{
                                htmlInput: {
                                    autoComplete: "new-password",
                                },

                                input: {
                                    endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                        edge="end"
                                        type="button"
                                        aria-label={
                                            showConfirmPassword
                                            ? "Hide confirmation password"
                                            : "Show confirmation password"
                                        }
                                        onClick={() =>
                                            setShowConfirmPassword(
                                            (current) =>
                                                !current
                                            )
                                        }
                                        >
                                        {showConfirmPassword ? (
                                            <VisibilityOffRounded />
                                        ) : (
                                            <VisibilityRounded />
                                        )}
                                        </IconButton>
                                    </InputAdornment>
                                    ),
                                },
                                }}
                            />
                            </Grid>
                        </Grid>

                        <Stack
                            direction="row"
                            justifyContent="flex-end"
                            sx={{ mt: 3 }}
                        >
                            <Button
                            type="submit"
                            variant="contained"
                            color="secondary"
                            startIcon={
                                changingPassword ? (
                                <CircularProgress
                                    size={18}
                                    color="inherit"
                                />
                                ) : (
                                <LockResetRounded />
                                )
                            }
                            disabled={
                                changingPassword ||
                                !passwordData.currentPassword ||
                                !passwordData.newPassword ||
                                !passwordData.confirmPassword
                            }
                            sx={{
                                minHeight: 46,
                                borderRadius: "14px",

                                transition:
                                "transform 180ms ease",

                                "&:active": {
                                transform: "scale(0.97)",
                                },
                            }}
                            >
                            {changingPassword
                                ? "Changing..."
                                : "Change password"}
                            </Button>
                        </Stack>
                        </Box>
                </CardContent>
              </MotionCard>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      {/* Profile image crop dialog */}
      <Dialog
        open={cropDialogOpen}
        onClose={handleCloseCropDialog}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px",
              overflow: "hidden",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight={850}
            >
              Crop Profile Picture
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Move and zoom the image inside
              the circle.
            </Typography>
          </Box>

          <IconButton
            onClick={
              handleCloseCropDialog
            }
            disabled={uploadingImage}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: {
                xs: 320,
                sm: 430,
              },

              overflow: "hidden",
              borderRadius: "18px",

              backgroundColor: "#111827",
            }}
          >
            {selectedImage && (
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                objectFit="contain"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={
                  handleCropComplete
                }
              />
            )}
          </Box>

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mt: 3 }}
          >
            <ZoomInRounded
              color="action"
            />

            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(_event, value) =>
                setZoom(value)
              }
              aria-label="Image zoom"
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Button
            color="inherit"
            disabled={uploadingImage}
            onClick={
              handleCloseCropDialog
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            startIcon={
              uploadingImage ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <SaveRounded />
              )
            }
            disabled={
              uploadingImage ||
              !croppedAreaPixels
            }
            onClick={
              handleUploadCroppedImage
            }
          >
            {uploadingImage
              ? "Uploading..."
              : "Crop and upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfilePage;