import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { motion } from "motion/react";

import {
  ApartmentRounded,
  DashboardRounded,
  LogoutRounded,
  MenuRounded,
  PaymentsRounded,
  PersonRounded,
  ReceiptLongRounded,
} from "@mui/icons-material";

import {
  AppBar,
  Avatar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import { useAuth } from "../contexts/AuthContext";
import userService from "../services/userService";

const drawerWidth = 258;

const menuItems = [
  {
    label: "Overview",
    icon: <DashboardRounded />,
    path: "/customer/dashboard",
  },
  {
    label: "My Payments",
    icon: <PaymentsRounded />,
    path: "/customer/payments",
  },
  {
    label: "Transactions",
    icon: <ReceiptLongRounded />,
    path: "/customer/transactions",
  },
  {
    label: "My Profile",
    icon: <PersonRounded />,
    path: "/customer/profile",
  },
];

const pageInformation = {
  "/customer/dashboard": {
    title: "Overview",
    description:
      "Your latest account and payment activity",
  },

  "/customer/payments": {
    title: "My Payments",
    description:
      "Review and manage your payment records",
  },

  "/customer/transactions": {
    title: "Transactions",
    description:
      "View your completed transaction history",
  },

  "/customer/profile": {
    title: "Account Settings",
    description:
      "Manage your profile and account security",
  },
};

const CustomerDashboardLayout = () => {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [profileImageSrc, setProfileImageSrc] =
    useState("");

  const { user, logout, updateUser } =
    useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const currentPage =
    pageInformation[location.pathname] ||
    pageInformation["/customer/dashboard"];

  const loadNavbarProfile =
    useCallback(async () => {
      try {
        const profile =
          await userService.getMyProfile();

        updateUser({
          fullName: profile?.fullName,
          email: profile?.email,
          profileImageUrl:
            profile?.profileImageUrl,
        });

        if (!profile?.profileImageUrl) {
          setProfileImageSrc("");
          return;
        }

        const imageBlob =
          await userService.getProtectedImage(
            profile.profileImageUrl
          );

        const objectUrl =
          URL.createObjectURL(imageBlob);

        setProfileImageSrc((currentUrl) => {
          if (
            currentUrl &&
            currentUrl.startsWith("blob:")
          ) {
            URL.revokeObjectURL(currentUrl);
          }

          return objectUrl;
        });
      } catch (error) {
        console.error(
          "Unable to load navbar profile:",
          error
        );
      }
    }, [updateUser]);

  useEffect(() => {
    loadNavbarProfile();
  }, [
    loadNavbarProfile,
    user?.profileImageUrl,
    user?.fullName,
  ]);

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
    };
  }, [profileImageSrc]);

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        px: 2,
        py: 2,

        background:
          "linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,251,255,0.97))",

        backdropFilter: "blur(24px)",
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.4,
          px: 1,
          mb: 3.5,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,

            display: "grid",
            placeItems: "center",

            borderRadius: "14px",

            color: "#ffffff",

            background:
              "linear-gradient(135deg, #2563eb, #60a5fa)",

            boxShadow:
              "0 10px 24px rgba(37,99,235,0.22)",
          }}
        >
          <ApartmentRounded />
        </Box>

        <Box>
          <Typography
            fontWeight={900}
            color="#172033"
            sx={{
              lineHeight: 1.15,
              letterSpacing: "-0.35px",
            }}
          >
            Skyline Living
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Apartments
          </Typography>
        </Box>
      </Box>

      <Typography
        variant="caption"
        sx={{
          px: 1.5,
          mb: 1,
          color: "#9aa3b2",
          fontWeight: 800,
          letterSpacing: 1.1,
        }}
      >
        NAVIGATION
      </Typography>

      <List disablePadding>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            onClick={() =>
              setMobileOpen(false)
            }
            sx={{
              minHeight: 48,
              mb: 0.65,
              px: 1.5,

              borderRadius: "14px",
              color: "#64748b",

              transition:
                "all 180ms cubic-bezier(.2,.8,.2,1)",

              "&.active": {
                color: "#2563eb",

                background:
                  "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(96,165,250,0.07))",

                boxShadow:
                  "inset 0 0 0 1px rgba(37,99,235,0.11)",
              },

              "&:hover": {
                color: "#2563eb",

                backgroundColor:
                  "rgba(37,99,235,0.065)",

                transform:
                  "translateX(3px)",
              },

              "&:active": {
                transform:
                  "translateX(3px) scale(0.97)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 39,
                color: "inherit",
              }}
            >
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.label}
              slotProps={{
                primary: {
                  fontWeight: 700,
                  fontSize: 14,
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* Push logout section to the bottom */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Compact logout footer */}
      <Box
        sx={{
          pt: 1.5,
          borderTop:
            "1px solid rgba(148,163,184,0.17)",
        }}
      >
        <ListItemButton
          onClick={handleLogout}
          sx={{
            minHeight: 46,
            px: 1.5,

            borderRadius: "13px",
            color: "#dc2626",

            transition:
              "all 180ms ease",

            "&:hover": {
              backgroundColor:
                "rgba(220,38,38,0.07)",
            },

            "&:active": {
              transform: "scale(0.97)",
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 39,
              color: "inherit",
            }}
          >
            <LogoutRounded
              sx={{ fontSize: 21 }}
            />
          </ListItemIcon>

          <ListItemText
            primary="Sign out"
            slotProps={{
              primary: {
                fontWeight: 700,
                fontSize: 14,
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",

        background:
          "radial-gradient(circle at 92% 3%, rgba(96,165,250,0.13), transparent 25%), radial-gradient(circle at 16% 92%, rgba(167,139,250,0.07), transparent 28%), #f6f8fc",
      }}
    >
      {/* Top navbar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: {
            md: `calc(100% - ${drawerWidth}px)`,
          },

          ml: {
            md: `${drawerWidth}px`,
          },

          color: "#172033",

          backgroundColor:
            "rgba(255,255,255,0.84)",

          backdropFilter: "blur(24px)",

          borderBottom:
            "1px solid rgba(148,163,184,0.18)",

          boxShadow:
            "0 7px 25px rgba(40,65,95,0.035)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: "76px !important",

            px: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          <IconButton
            onClick={() =>
              setMobileOpen(true)
            }
            sx={{
              mr: 1.5,

              display: {
                md: "none",
              },
            }}
          >
            <MenuRounded />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Typography
              fontWeight={850}
              color="#172033"
              sx={{
                letterSpacing: "-0.25px",
              }}
            >
              {currentPage.title}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              {currentPage.description}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,

              px: {
                xs: 0,
                sm: 1,
              },
            }}
          >
            <Box
              sx={{
                display: {
                  xs: "none",
                  sm: "block",
                },

                textAlign: "right",
              }}
            >
              <Typography
                variant="body2"
                fontWeight={800}
                color="#172033"
              >
                {user?.fullName ||
                  "Customer"}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                {user?.sub ||
                  user?.email ||
                  "Customer account"}
              </Typography>
            </Box>

            <Avatar
              src={
                profileImageSrc ||
                undefined
              }
              onClick={() =>
                navigate(
                  "/customer/profile"
                )
              }
              sx={{
                width: 45,
                height: 45,

                cursor: "pointer",

                background:
                  "linear-gradient(135deg, #2563eb, #60a5fa)",

                boxShadow:
                  "0 9px 22px rgba(37,99,235,0.22)",

                transition:
                  "all 180ms ease",

                "&:hover": {
                  transform:
                    "translateY(-2px) scale(1.03)",

                  boxShadow:
                    "0 13px 28px rgba(37,99,235,0.28)",
                },

                "&:active": {
                  transform:
                    "scale(0.96)",
                },
              }}
            >
              {user?.fullName
                ?.charAt(0)
                ?.toUpperCase() || "C"}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebars */}
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() =>
            setMobileOpen(false)
          }
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: {
              xs: "block",
              md: "none",
            },

            "& .MuiDrawer-paper": {
              width: drawerWidth,
              height: "100dvh",
              border: 0,
              overflow: "hidden",
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: {
              xs: "none",
              md: "block",
            },

            "& .MuiDrawer-paper": {
              width: drawerWidth,
              height: "100dvh",

              display: "flex",
              flexDirection: "column",

              overflow: "hidden",

              borderRight:
                "1px solid rgba(148,163,184,0.16)",

              boxShadow:
                "8px 0 35px rgba(42,69,99,0.04)",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Page content */}
      <Box
        component={motion.main}
        key={location.pathname}
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.36,
          ease: [0.2, 0.8, 0.2, 1],
        }}
        sx={{
          ml: {
            md: `${drawerWidth}px`,
          },

          pt: 12,

          px: {
            xs: 2,
            sm: 3,
            lg: 4,
          },

          pb: 5,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default CustomerDashboardLayout;