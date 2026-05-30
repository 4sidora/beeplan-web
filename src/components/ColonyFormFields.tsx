import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import RefreshIcon from "@mui/icons-material/Refresh";
import { BeeBreedSelect } from "./BeeBreedSelect";
import { ColonyTypeSelect } from "./ColonyTypeSelect";
import { HiveTypeFields } from "./HiveTypeFields";
import type { ColonyTypeCode } from "../utils/colonyCatalog";
import type { HiveFieldState } from "../utils/colonyCatalog";

type Props = {
  name: string;
  onNameChange: (v: string) => void;
  onRegenerateName?: () => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  colonyType: ColonyTypeCode | "";
  onColonyTypeChange: (v: ColonyTypeCode | "") => void;
  hiveFields: HiveFieldState;
  onHiveFieldsChange: (s: HiveFieldState) => void;
  beeBreed: string;
  onBeeBreedChange: (v: string) => void;
};

export function ColonyFormFields({
  name,
  onNameChange,
  onRegenerateName,
  description,
  onDescriptionChange,
  colonyType,
  onColonyTypeChange,
  hiveFields,
  onHiveFieldsChange,
  beeBreed,
  onBeeBreedChange,
}: Props) {
  return (
    <>
      <TextField
        autoFocus
        fullWidth
        label="Название"
        margin="normal"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        slotProps={
          onRegenerateName
            ? {
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={onRegenerateName}
                        edge="end"
                        title="Другое имя"
                        aria-label="Другое имя"
                      >
                        <RefreshIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }
            : undefined
        }
      />
      <TextField
        fullWidth
        label="Описание"
        margin="normal"
        multiline
        minRows={4}
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
      />
      <ColonyTypeSelect value={colonyType} onChange={onColonyTypeChange} />
      <HiveTypeFields state={hiveFields} onChange={onHiveFieldsChange} />
      <BeeBreedSelect value={beeBreed} onChange={onBeeBreedChange} />
    </>
  );
}
