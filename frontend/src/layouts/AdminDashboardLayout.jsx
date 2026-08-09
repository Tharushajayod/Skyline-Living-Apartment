import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { hasModuleAccess } from "../config/roleAccess";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { motion } from "motion/react";

import {
  AdminPanelSettingsRounded,
  ApartmentRounded,
  AssessmentRounded,
  CalendarMonthRounded,
  DashboardRounded,
  GroupsRounded,
  LogoutRounded,
  MenuRounded,
  PaymentsRounded,
  QuestionAnswerRounded,
  SellRounded,
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

import PaymentTransactionTabs from "../components/admin/PaymentTransactionTabs";
import UsersStaffTabs from "../components/admin/UsersStaffTabs";

const drawerWidth = 260;

const menuItems = [
  {
    label: "Overview",
    icon: <DashboardRounded />,
    path: "/admin/dashboard",
    module: "dashboard",
  },

  {
    label: "Apartments & Projects",
    icon: <ApartmentRounded />,
    path: "/admin/apartments-projects",
    module: "apartmentsProjects",
  },

  {
    label:
      "Appointments & Reservations",
    icon:
      <CalendarMonthRounded />,
    path:
      "/admin/appointments-reservations",
    module:
      "appointmentsReservations",
  },

  {
    label:
      "Inquiries & Customer Relations",
    icon:
      <QuestionAnswerRounded />,
    path: "/admin/inquiries",
    module: "inquiries",
  },

  {
    label: "Sales Management",
    icon: <SellRounded />,
    path: "/admin/sales",
    module: "sales",
  },

  {
    label:
      "Users & Staff Management",
    icon: <GroupsRounded />,
    path: "/admin/users-staff",
    module: "usersStaff",
  },

  {
    label:
      "Payment & Transaction",
    icon: <PaymentsRounded />,
    path:
      "/admin/payment-transaction",
    module:
      "paymentsTransactions",
  },

  {
    label:
      "Reports & Analytics",
    icon: <AssessmentRounded />,
    path: "/admin/reports",
    module: "reports",
  },
];

const pageInformation = {
  "/admin/dashboard": {
    title: "Overview",
    description: "View your available management functions",
  },

  "/admin/apartments-projects": {
    title:
      "Apartments and Projects",
    description:
      "Manage projects, units, availability and property information",
  },

  "/admin/appointments-reservations": {
    title:
      "Appointments and Reservations",
    description:
      "Manage viewing appointments and apartment reservations",
  },

  "/admin/inquiries": {
    title:
      "Inquiries and Customer Relations",
    description:
      "Manage customer inquiries, leads and communication",
  },

  "/admin/sales": {
    title: "Sales Management",
    description:
      "Monitor apartment sales and customer purchase activity",
  },

  "/admin/users-staff": {
    title:
      "Users and Staff Management",
    description:
      "Manage user accounts, staff information and access",
  },

  "/admin/payment-transaction": {
    title:
      "Payment and Transaction Management",
    description:
      "Review payments, transactions, verification and receipts",
  },

  "/admin/reports": {
    title:
      "Reports and Analytics",
    description:
      "Review platform performance, revenue and operational reports",
  },
};

const AdminDashboardLayout = () => {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const { user, logout } = useAuth();

  const visibleMenuItems =
  menuItems.filter((item) =>
    hasModuleAccess(
      user?.role,
      item.module
    )
  );

  const navigate = useNavigate();
  const location = useLocation();

  const currentPage =
  Object.entries(pageInformation)
    .sort(
      ([firstPath], [secondPath]) =>
        secondPath.length -
        firstPath.length
    )
    .find(([path]) =>
      path === "/admin/dashboard"
        ? location.pathname === path
        : location.pathname.startsWith(
            path
          )
    )?.[1] ||
  pageInformation[
    "/admin/dashboard"
  ];

  const isPaymentTransactionPage =
    location.pathname.startsWith(
      "/admin/payment-transaction"
    );

  const isUsersStaffPage =
    location.pathname.startsWith(
      "/admin/users-staff"
    );

  const handleLogout = () => {
    logout();
    navigate("/login", {
      replace: true,
    });
  };

  const drawerContent = (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: 2,
        py: 2,

        background:
          "linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,250,255,0.97))",
      }}
    >
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
              "linear-gradient(135deg, #4f46e5, #818cf8)",

            boxShadow:
              "0 10px 24px rgba(79,70,229,0.22)",
          }}
        >
          <AdminPanelSettingsRounded />
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
            {user?.role === "ADMIN"
              ? "Administration"
              : String(user?.role || "")
                  .replaceAll("_", " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (letter) =>
                    letter.toUpperCase()
                  )}
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
        MANAGEMENT
      </Typography>

      <List disablePadding>
        {visibleMenuItems.map((item) => {
            const isActive =
                item.path === "/admin/dashboard"
                ? location.pathname === item.path
                : location.pathname.startsWith(
                    item.path
                    );

            return (
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

                    color: isActive
                    ? "#4f46e5"
                    : "#64748b",

                    background: isActive
                    ? "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(129,140,248,0.07))"
                    : "transparent",

                    boxShadow: isActive
                    ? "inset 0 0 0 1px rgba(79,70,229,0.11)"
                    : "none",

                    transition:
                    "all 180ms cubic-bezier(.2,.8,.2,1)",

                    "&:hover": {
                    color: "#4f46e5",

                    backgroundColor:
                        "rgba(79,70,229,0.06)",

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
            );
            })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

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
          "radial-gradient(circle at 92% 3%, rgba(129,140,248,0.12), transparent 25%), radial-gradient(circle at 12% 92%, rgba(96,165,250,0.08), transparent 28%), #f6f8fc",
      }}
    >
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
            "rgba(255,255,255,0.85)",

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

          <Box
            sx={{
              flexGrow: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                fontWeight={850}
                color="#172033"
                noWrap
              >
                {currentPage.title}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{
                  display: {
                    xs: "none",
                    sm: "block",
                  },
                }}
              >
                {currentPage.description}
              </Typography>
            </Box>

            {isUsersStaffPage && (
              <Box
                sx={{
                  ml: "auto",
                  display: {
                    xs: "none",
                    lg: "block",
                  },
                  flexShrink: 0,
                }}
              >
                <UsersStaffTabs compact />
              </Box>
            )}

            {isPaymentTransactionPage && (
              <Box
                sx={{
                  ml: "auto",
                  display: {
                    xs: "none",
                    lg: "block",
                  },
                  flexShrink: 0,
                }}
              >
                <PaymentTransactionTabs compact />
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              ml: 2,
              flexShrink: 0,
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
              >
                {user?.fullName ||
                  "Administrator"}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                {user?.sub ||
                  user?.email ||
                  "Administrator account"}
              </Typography>
            </Box>

            <Avatar
              sx={{
                width: 45,
                height: 45,

                background:
                  "linear-gradient(135deg, #4f46e5, #818cf8)",

                boxShadow:
                  "0 9px 22px rgba(79,70,229,0.22)",
              }}
            >
              {user?.fullName
                ?.charAt(0)
                ?.toUpperCase() || "A"}
            </Avatar>
          </Box>
        </Toolbar>

        {isUsersStaffPage && (
          <Box
            sx={{
              display: {
                xs: "block",
                lg: "none",
              },
              px: {
                xs: 2,
                sm: 3,
              },
              pb: 1.5,
            }}
          >
            <UsersStaffTabs compact fullWidth />
          </Box>
        )}

        {isPaymentTransactionPage && (
          <Box
            sx={{
              display: {
                xs: "block",
                lg: "none",
              },
              px: {
                xs: 2,
                sm: 3,
              },
              pb: 1.5,
            }}
          >
            <PaymentTransactionTabs compact fullWidth />
          </Box>
        )}
      </AppBar>

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

          pt:
            isPaymentTransactionPage ||
            isUsersStaffPage
              ? {
                  xs: 18,
                  lg: 12,
                }
              : 12,

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

export default AdminDashboardLayout;