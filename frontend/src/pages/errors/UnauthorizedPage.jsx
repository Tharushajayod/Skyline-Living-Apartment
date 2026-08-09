import { Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <Stack
      spacing={2}
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: "100vh" }}
    >
      <Typography variant="h2">403</Typography>

      <Typography variant="h5">
        You are not authorized to view this page.
      </Typography>

      <Button
        variant="contained"
        onClick={() => navigate(-1)}
      >
        Go Back
      </Button>
    </Stack>
  );
};

export default UnauthorizedPage;