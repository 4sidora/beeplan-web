import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { FirmwareVersionInfo } from "./FirmwareVersionInfo";
import {
  boardById,
  boardsForProfile,
  type FirmwareBoard,
  type FirmwareBoardId,
  type FirmwareProfile,
} from "../constants/boards";

type Props = {
  profile: FirmwareProfile;
  value: FirmwareBoardId;
  onChange: (boardId: FirmwareBoardId) => void;
  deviceType: "gateway" | "edge";
  installedVersion?: string | null;
  /** Показать блок «Версия прошивки» (на edge-мастере скрыт на шаге платы — уже есть на шаге 1) */
  showFirmwareVersion?: boolean;
};

function BoardOption({
  board,
  selected,
  onSelect,
}: {
  board: FirmwareBoard;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <ButtonBase
      onClick={onSelect}
      sx={{
        display: "block",
        width: "100%",
        textAlign: "left",
        borderRadius: 1,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          px: 1.5,
          py: 1.25,
          borderColor: selected ? "primary.main" : "divider",
          borderWidth: selected ? 2 : 1,
          bgcolor: selected ? "action.selected" : "background.paper",
          transition: "border-color 0.15s, background-color 0.15s",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ color: selected ? "primary.main" : "action.disabled", mt: 0.15, flexShrink: 0 }}>
            {selected ? (
              <CheckCircleIcon fontSize="small" />
            ) : (
              <RadioButtonUncheckedIcon fontSize="small" />
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: selected ? 700 : 500, lineHeight: 1.35 }}
            >
              {board.label}
            </Typography>
            {!board.firmwareAvailable ? (
              <Box sx={{ mt: 0.5 }}>
                <Chip label="В разработке" size="small" variant="outlined" sx={{ height: 20 }} />
              </Box>
            ) : null}
          </Box>
        </Box>
      </Paper>
    </ButtonBase>
  );
}

export function FirmwareBoardPicker({
  profile,
  value,
  onChange,
  deviceType,
  installedVersion,
  showFirmwareVersion = true,
}: Props) {
  const boards = boardsForProfile(profile);
  const selected = boardById(value);
  const [imageOpen, setImageOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {showFirmwareVersion ? (
          <Box sx={{ width: "100%", "& .MuiAlert-root": { mb: 0 } }}>
            <FirmwareVersionInfo
              deviceType={deviceType}
              installedVersion={installedVersion}
              installOverview
            />
          </Box>
        ) : null}

        <Typography
          id="firmware-board-picker-label"
          variant="subtitle1"
          sx={{ fontWeight: 600, lineHeight: 1.3 }}
        >
          Выберите плату:
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 0.75fr) minmax(0, 1.25fr)" },
            gap: { xs: 2, md: 3 },
            alignItems: "start",
          }}
        >
          <Box
            role="radiogroup"
            aria-labelledby="firmware-board-picker-label"
            sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}
          >
            {boards.map((board) => (
              <BoardOption
                key={board.id}
                board={board}
                selected={board.id === value}
                onSelect={() => onChange(board.id as FirmwareBoardId)}
              />
            ))}
          </Box>

          {selected ? (
            <Paper variant="outlined" sx={{ p: 2, minWidth: 0 }}>
              <Box
                sx={{ display: "flex", alignItems: "flex-start", gap: 1, flexWrap: "wrap", mb: 1.5 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1, lineHeight: 1.3 }}>
                  {selected.label}
                </Typography>
                {!selected.firmwareAvailable ? (
                  <Chip label="В разработке" size="small" variant="outlined" />
                ) : null}
              </Box>

              <Box
                sx={{
                  "&::after": { content: '""', display: "table", clear: "both" },
                }}
              >
                <Box
                  component="button"
                  type="button"
                  onClick={() => setImageOpen(true)}
                  aria-label={`Увеличить фото: ${selected.label}`}
                  sx={{
                    float: "left",
                    p: 0,
                    mr: 2,
                    mb: 1,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    bgcolor: "grey.50",
                    cursor: "zoom-in",
                    overflow: "hidden",
                    width: 140,
                    flexShrink: 0,
                    "&:hover": { borderColor: "primary.main" },
                  }}
                >
                  <Box
                    component="img"
                    src={selected.imageUrl}
                    alt={selected.label}
                    sx={{
                      display: "block",
                      width: "100%",
                      height: 100,
                      objectFit: "contain",
                      p: 0.75,
                    }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {selected.description}
                </Typography>
              </Box>

              <Box sx={{ clear: "both", pt: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>
                  Характеристики
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {selected.features.map((feature) => (
                    <Typography
                      component="li"
                      key={feature}
                      variant="body2"
                      sx={{ lineHeight: 1.5, mb: 0.25 }}
                    >
                      {feature}
                    </Typography>
                  ))}
                </Box>

                {!selected.firmwareAvailable ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Прошивка для этой платы пока в разработке. Выберите другую плату в списке слева.
                  </Typography>
                ) : null}

                {selected.storeUrl ? (
                  <Link
                    href={selected.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body2"
                    sx={{ display: "inline-block", mt: 1 }}
                  >
                    AliExpress
                  </Link>
                ) : null}
              </Box>
            </Paper>
          ) : null}
        </Box>
      </Box>

      <Dialog fullScreen open={imageOpen} onClose={() => setImageOpen(false)}>
        <IconButton
          aria-label="Закрыть"
          onClick={() => setImageOpen(false)}
          sx={{ position: "absolute", right: 12, top: 12, zIndex: 1, bgcolor: "background.paper" }}
        >
          <CloseIcon />
        </IconButton>
        <Box
          role="button"
          tabIndex={0}
          onClick={() => setImageOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
              setImageOpen(false);
            }
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            bgcolor: "grey.900",
            p: 2,
            cursor: "zoom-out",
          }}
        >
          {selected ? (
            <Box
              component="img"
              src={selected.imageUrl}
              alt={selected.label}
              onClick={(e) => e.stopPropagation()}
              sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : null}
        </Box>
      </Dialog>
    </>
  );
}
