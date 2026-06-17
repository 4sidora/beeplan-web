import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, setToken } from "../api";
import { consumeReturnUrl, returnPathFromState } from "../utils/returnUrl";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: (data) => {
      setToken(data.access_token);
      const fromState = returnPathFromState(location.state?.from);
      const target = fromState || consumeReturnUrl("/");
      navigate(target, { replace: true });
    },
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Paper
        component="form"
        sx={{ p: 4, maxWidth: 400, width: "100%" }}
        elevation={2}
        onSubmit={(e) => {
          e.preventDefault();
          if (!login.isPending) login.mutate();
        }}
      >
        <Typography variant="h4" gutterBottom color="primary">
          BeePlan
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Войдите для управления пасеками и просмотра телеметрии.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="Email"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          fullWidth
          label="Пароль"
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button fullWidth variant="contained" size="large" sx={{ mt: 2 }} type="submit" disabled={login.isPending}>
          Войти
        </Button>
        {login.isError && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {String((login.error as Error).message)}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
