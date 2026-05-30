import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import {
  defaultHiveFieldsForType,
  HIVE_TYPES,
  type HiveFieldState,
  type HiveTypeCode,
} from "../utils/colonyCatalog";

type Props = {
  state: HiveFieldState;
  onChange: (state: HiveFieldState) => void;
};

export function HiveTypeFields({ state, onChange }: Props) {
  const spec = state.hiveType ? HIVE_TYPES.find((h) => h.code === state.hiveType) : null;

  const setHiveType = (code: HiveTypeCode | "") => {
    if (!code) {
      onChange({ hiveType: "", bodyCount: "", framesPerBody: "", hiveVolumeM3: "" });
      return;
    }
    onChange({
      hiveType: code,
      bodyCount: "",
      framesPerBody: "",
      hiveVolumeM3: "",
      ...defaultHiveFieldsForType(code),
    });
  };

  return (
    <>
      <FormControl fullWidth margin="normal">
        <InputLabel id="hive-type-label">Тип улья</InputLabel>
        <Select
          labelId="hive-type-label"
          label="Тип улья"
          value={state.hiveType}
          onChange={(e) => setHiveType(e.target.value as HiveTypeCode | "")}
        >
          <MenuItem value="">
            <em>— не указано —</em>
          </MenuItem>
          {HIVE_TYPES.map((h) => (
            <MenuItem key={h.code} value={h.code}>
              {h.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {spec?.usesVolume && (
        <TextField
          fullWidth
          type="number"
          label="Объём улья, м³"
          margin="normal"
          slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
          value={state.hiveVolumeM3}
          onChange={(e) =>
            onChange({
              ...state,
              hiveVolumeM3: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
        />
      )}

      {spec && !spec.usesVolume && spec.allowsBodyCount && (
        <TextField
          fullWidth
          type="number"
          label="Количество корпусов"
          margin="normal"
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
          value={state.bodyCount}
          onChange={(e) =>
            onChange({
              ...state,
              bodyCount: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
        />
      )}

      {spec && !spec.usesVolume && spec.frameOptions.length > 0 && (
        <FormControl fullWidth margin="normal">
          <InputLabel id="frames-label">Рамок на корпус</InputLabel>
          <Select
            labelId="frames-label"
            label="Рамок на корпус"
            value={state.framesPerBody === "" ? "" : String(state.framesPerBody)}
            onChange={(e) => {
              const v = e.target.value;
              onChange({
                ...state,
                framesPerBody: v === "" ? "" : Number(v),
              });
            }}
          >
            {spec.frameOptions.map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {spec && spec.fixedFrames != null && (
        <TextField
          fullWidth
          margin="normal"
          label="Рамок"
          value={spec.fixedFrames}
          disabled
          helperText="Фиксировано для выбранного типа улья"
        />
      )}
    </>
  );
}
