import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

type Props = {
  value: number | null;
  onChange: (id: number | null) => void;
  minWidth?: number;
  allowEmpty?: boolean;
};

export function ApiarySelect({ value, onChange, minWidth = 280, allowEmpty = false }: Props) {
  const { data: apiaries = [], isLoading } = useQuery({
    queryKey: ["apiaries"],
    queryFn: api.apiaries,
  });

  return (
    <FormControl size="small" sx={{ minWidth }} disabled={isLoading}>
      <InputLabel id="apiary-select-label">Пасека</InputLabel>
      <Select
        labelId="apiary-select-label"
        label="Пасека"
        value={value != null ? String(value) : ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Number(v));
        }}
      >
        {allowEmpty && <MenuItem value="">— не выбрана —</MenuItem>}
        {apiaries.map((a) => (
          <MenuItem key={a.id} value={a.id}>
            {a.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
