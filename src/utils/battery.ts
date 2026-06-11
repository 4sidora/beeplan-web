/** Li-ion 18650 на T-Energy — те же пороги, что в прошивке edge. */
export const LI_ION_EMPTY_V = 3.3;
export const LI_ION_FULL_V = 4.2;

/** Процент заряда из напряжения, округление до целых. */
export function voltageToPercent(volts: number): number {
  if (volts >= LI_ION_FULL_V) return 100;
  if (volts <= LI_ION_EMPTY_V) return 0;
  return Math.round(((volts - LI_ION_EMPTY_V) / (LI_ION_FULL_V - LI_ION_EMPTY_V)) * 100);
}

export function formatBatteryVolts(volts: number): string {
  return `${volts.toFixed(2)} V`;
}

export function formatBatterySummary(volts: number): string {
  return `${voltageToPercent(volts)}% · ${formatBatteryVolts(volts)}`;
}
