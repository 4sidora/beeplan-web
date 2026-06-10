import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import FormLabel from "@mui/material/FormLabel";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import {
  boardById,
  boardsForProfile,
  type FirmwareBoardId,
  type FirmwareProfile,
} from "../constants/boards";

type Props = {
  profile: FirmwareProfile;
  value: FirmwareBoardId;
  onChange: (boardId: FirmwareBoardId) => void;
};

export function FirmwareBoardPicker({ profile, value, onChange }: Props) {
  const boards = boardsForProfile(profile);
  const selected = boardById(value);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormLabel id="firmware-board-picker-label">Плата (MCU)</FormLabel>
      <Box
        role="radiogroup"
        aria-labelledby="firmware-board-picker-label"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        {boards.map((board) => {
          const selectedCard = board.id === value;
          return (
            <Card
              key={board.id}
              variant="outlined"
              sx={{
                borderColor: selectedCard ? "primary.main" : "divider",
                borderWidth: selectedCard ? 2 : 1,
              }}
            >
              <CardActionArea onClick={() => onChange(board.id as FirmwareBoardId)}>
                {board.imageUrl ? (
                  <CardMedia
                    component="img"
                    height="140"
                    image={board.imageUrl}
                    alt={board.label}
                    sx={{ objectFit: "contain", bgcolor: "grey.50", p: 1 }}
                  />
                ) : null}
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
                      {board.label}
                    </Typography>
                    {board.recommendedForEdge ? (
                      <Chip label="Рекомендуется" size="small" color="primary" />
                    ) : null}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {board.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
      {selected ? (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Особенности: {selected.label}
          </Typography>
          <List dense disablePadding>
            {selected.features.map((feature) => (
              <ListItem key={feature} disableGutters sx={{ py: 0.25 }}>
                <ListItemText primary={`• ${feature}`} />
              </ListItem>
            ))}
          </List>
        </Box>
      ) : null}
    </Box>
  );
}
