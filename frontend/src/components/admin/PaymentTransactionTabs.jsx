import {
  PaymentsRounded,
  ReceiptLongRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Stack,
} from "@mui/material";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

const items = [
  {
    label: "Payments",
    path: "/admin/payment-transaction/payments",
    icon: <PaymentsRounded />,
  },
  {
    label: "Transactions",
    path: "/admin/payment-transaction/transactions",
    icon: <ReceiptLongRounded />,
  },
];

const PaymentTransactionTabs = ({
  compact = false,
  fullWidth = false,
}) => {
  const location = useLocation();

  return (
    <Box
      sx={{
        p: compact ? 0.4 : 0.6,
        width: fullWidth ? "100%" : "auto",
        borderRadius: compact ? "13px" : "16px",
        background:
          "rgba(255,255,255,0.78)",
        backdropFilter: "blur(18px)",
        border:
          "1px solid rgba(148,163,184,0.18)",
        boxShadow:
          "0 8px 24px rgba(51,65,85,0.06)",
      }}
    >
      <Stack
        direction="row"
        spacing={0.4}
        sx={{
          width: fullWidth
            ? "100%"
            : "max-content",
        }}
      >
        {items.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(
              `${item.path}/`
            );

          return (
            <Button
              key={item.path}
              component={NavLink}
              to={item.path}
              startIcon={item.icon}
              sx={{
                flex: fullWidth ? 1 : "initial",
                minWidth: compact ? 118 : 135,
                minHeight: compact ? 38 : 43,
                px: compact ? 1.35 : 1.8,
                borderRadius: compact
                  ? "10px"
                  : "12px",
                color: isActive
                  ? "#4f46e5"
                  : "#64748b",
                background: isActive
                  ? "linear-gradient(135deg, rgba(79,70,229,0.14), rgba(99,102,241,0.08))"
                  : "transparent",
                boxShadow: isActive
                  ? "inset 0 0 0 1px rgba(79,70,229,0.14)"
                  : "none",
                fontSize: compact ? 13 : 14,
                fontWeight: 800,
                textTransform: "none",
                whiteSpace: "nowrap",
                transition:
                  "all 170ms ease",
                "&:hover": {
                  background: isActive
                    ? "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(99,102,241,0.10))"
                    : "rgba(79,70,229,0.06)",
                  transform:
                    "translateY(-1px)",
                },
                "&:active": {
                  transform: "scale(0.97)",
                },
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
};

export default PaymentTransactionTabs;