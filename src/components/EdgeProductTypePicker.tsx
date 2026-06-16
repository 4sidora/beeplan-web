import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import {
  EDGE_PRODUCT_TYPES,
  type EdgeProductTypeId,
  edgeProductTypeById,
} from "../constants/edgeProductTypes";

type Props = {
  value: EdgeProductTypeId;
  onChange: (id: EdgeProductTypeId) => void;
};

export function EdgeProductTypePicker({ value, onChange }: Props) {
  const selected = edgeProductTypeById(value);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <FormControl>
        <FormLabel id="edge-product-type-label">Тип устройства</FormLabel>
        <RadioGroup
          aria-labelledby="edge-product-type-label"
          value={value}
          onChange={(e) => onChange(e.target.value as EdgeProductTypeId)}
        >
          {EDGE_PRODUCT_TYPES.map((product) => (
            <FormControlLabel
              key={product.id}
              value={product.id}
              control={<Radio size="small" />}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2">{product.label}</Typography>
                  {!product.firmwareAvailable ? (
                    <Chip label="В разработке" size="small" variant="outlined" />
                  ) : null}
                </Box>
              }
            />
          ))}
        </RadioGroup>
      </FormControl>
      {selected ? (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {selected.capabilities}
        </Typography>
      ) : null}
      {selected && !selected.firmwareAvailable ? (
        <Typography variant="body2" color="text.secondary">
          Прошивка для «{selected.label}» пока в разработке. Выберите другой тип устройства, чтобы
          продолжить.
        </Typography>
      ) : null}
    </Box>
  );
}
