import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  allowEmpty?: boolean;
};

export function BeeBreedSelect({ value, onChange, required = false, allowEmpty = true }: Props) {
  const { data: breeds = [], isLoading } = useQuery({
    queryKey: ["bee-breeds"],
    queryFn: api.beeBreeds,
  });

  return (
    <FormControl fullWidth margin="normal" required={required} disabled={isLoading}>
      <InputLabel id="bee-breed-label">Порода пчёл</InputLabel>
      <Select
        labelId="bee-breed-label"
        label="Порода пчёл"
        value={value}
        onChange={(e) => onChange(String(e.target.value))}
      >
        {allowEmpty && <MenuItem value="">— не указана —</MenuItem>}
        {breeds.map((b) => (
          <MenuItem key={b.id} value={b.name}>
            {b.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
