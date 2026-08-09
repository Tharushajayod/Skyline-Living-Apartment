import { Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Stack
      spacing={2}
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: "100vh" }}
    >
      <Typography variant="h2">404</Typography>

      <Typography variant="h5">
        Page not found.
      </Typography>

      <Button
        variant="contained"
        onClick={() => navigate("/")}
      >
        Go Home
      </Button>
    </Stack>
  );
};

export default NotFoundPage;