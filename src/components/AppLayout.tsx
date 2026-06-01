import HiveIcon from "@mui/icons-material/Hive";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import YardIcon from "@mui/icons-material/Yard";
import GroupsIcon from "@mui/icons-material/Groups";
import DevicesIcon from "@mui/icons-material/Devices";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api, setToken } from "../api";

const drawerWidth = 240;

const navItems = [
  { to: "/", label: "Главная", icon: <DashboardIcon /> },
  { to: "/apiaries", label: "Пасеки", icon: <YardIcon /> },
  { to: "/colonies", label: "Семьи", icon: <GroupsIcon /> },
  { to: "/devices", label: "Устройства", icon: <DevicesIcon /> },
  { to: "/telemetry", label: "Телеметрия", icon: <ShowChartIcon /> },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const me = useQuery({ queryKey: ["me"], queryFn: api.me });

  const drawer = (
    <Box>
      <Toolbar sx={{ gap: 1 }}>
        <HiveIcon color="primary" />
        <Typography variant="h6" noWrap>
          BeePlan
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.to === "/"}
            onClick={() => setMobileOpen(false)}
            sx={{
              "&.active": {
                bgcolor: "action.selected",
                borderRight: 3,
                borderColor: "primary.main",
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={1}
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            sx={{ mr: 2, display: { sm: "none" } }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Мониторинг пчелиных семей
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2, display: { xs: "none", md: "block" } }}>
            {me.data?.email}
          </Typography>
          <Button
            size="small"
            onClick={() => {
              setToken(null);
              navigate("/login");
            }}
          >
            Выйти
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
