import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import YardIcon from "@mui/icons-material/Yard";
import { ColonyIcon } from "../constants/colonyIcon";
import DevicesIcon from "@mui/icons-material/Devices";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TerminalIcon from "@mui/icons-material/Terminal";
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
import { BeePlanLogo } from "./BeePlanLogo";
import { TOOLBAR_HEIGHT } from "../constants/layout";

const drawerWidth = 240;

type NavIsActiveFn = (data: { isActive: boolean; location: { pathname: string } }) => boolean;

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  isActive?: NavIsActiveFn;
};

function isDevicesNavActive({ location }: { location: { pathname: string } }) {
  const pathname = location.pathname;
  return (
    pathname === "/devices" ||
    (pathname.startsWith("/devices/") && !pathname.startsWith("/devices/monitor"))
  );
}

const navItems: NavItem[] = [
  { to: "/", label: "Главная", icon: <DashboardIcon />, end: true },
  { to: "/apiaries", label: "Пасеки", icon: <YardIcon /> },
  { to: "/colonies", label: "Семьи", icon: <ColonyIcon /> },
  { to: "/devices", label: "Устройства", icon: <DevicesIcon />, isActive: isDevicesNavActive },
  { to: "/devices/monitor", label: "Монитор порта", icon: <TerminalIcon />, end: true },
  { to: "/telemetry", label: "Телеметрия", icon: <ShowChartIcon /> },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const me = useQuery({ queryKey: ["me"], queryFn: api.me });

  const drawer = (
    <Box>
      <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
        <BeePlanLogo height={34} />
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.end ?? false}
            {...(item.isActive ? { isActive: item.isActive } : {})}
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
          <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 1.25 }}>
            <BeePlanLogo height={38} />
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: { xs: "none", sm: "block" }, lineHeight: 1.2 }}
            >
              Мониторинг пчелиных семей
            </Typography>
          </Box>
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
        sx={(theme) => ({
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minWidth: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          mt: `${TOOLBAR_HEIGHT.xs}px`,
          height: `calc(100vh - ${TOOLBAR_HEIGHT.xs}px)`,
          [theme.breakpoints.up("sm")]: {
            mt: `${TOOLBAR_HEIGHT.sm}px`,
            height: `calc(100vh - ${TOOLBAR_HEIGHT.sm}px)`,
          },
        })}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
