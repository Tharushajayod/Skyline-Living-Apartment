import {
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  Box,
  Button,
  Stack,
} from "@mui/material";

const ModuleTabs = ({ items }) => {
  const location = useLocation();

  return (
    <Box
      sx={{
        p: 0.6,
        maxWidth: "100%",
        overflowX: "auto",
        borderRadius: "16px",

        background:
          "rgba(255, 255, 255, 0.88)",

        backdropFilter: "blur(18px)",

        border:
          "1px solid rgba(148, 163, 184, 0.16)",

        boxShadow:
          "0 10px 28px rgba(51, 65, 85, 0.07)",
      }}
    >
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          width: "max-content",
          minWidth: "100%",
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
              disableElevation
              sx={{
                minHeight: 43,
                px: 1.8,
                borderRadius: "12px",

                color: isActive
                  ? "#4f46e5"
                  : "#64748b",

                background: isActive
                  ? "linear-gradient(135deg, rgba(79,70,229,0.13), rgba(99,102,241,0.07))"
                  : "transparent",

                boxShadow: isActive
                  ? "inset 0 0 0 1px rgba(79,70,229,0.13)"
                  : "none",

                fontSize: 14,
                fontWeight: 800,
                textTransform: "none",
                whiteSpace: "nowrap",

                transition:
                  "all 170ms ease",

                "&:hover": {
                  background: isActive
                    ? "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(99,102,241,0.09))"
                    : "rgba(79,70,229,0.055)",

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

export default ModuleTabs;