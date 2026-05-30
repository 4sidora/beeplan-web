import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { COLONY_TYPES, type ColonyTypeCode } from "../utils/colonyCatalog";

type Props = {
  value: ColonyTypeCode | "";
  onChange: (value: ColonyTypeCode | "") => void;
};

export function ColonyTypeSelect({ value, onChange }: Props) {
  return (
    <FormControl fullWidth margin="normal">
      <InputLabel id="colony-type-label">Тип семьи</InputLabel>
      <Select
        labelId="colony-type-label"
        label="Тип семьи"
        value={value}
        onChange={(e) => onChange(e.target.value as ColonyTypeCode | "")}
      >
        <MenuItem value="">
          <em>— не указано —</em>
        </MenuItem>
        {COLONY_TYPES.map((t) => (
          <MenuItem key={t.code} value={t.code}>
            {t.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
