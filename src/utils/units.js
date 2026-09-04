const KG_PER_LB = 0.45359237;

export function kgToDisplay(kg, unit) {
  if (kg === null || kg === undefined || kg === '') return '';
  const n = Number(kg);
  if (Number.isNaN(n)) return '';
  const value = unit === 'lb' ? n / KG_PER_LB : n;
  return Math.round(value * 10) / 10;
}

export function displayToKg(value, unit) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return unit === 'lb' ? Math.round(n * KG_PER_LB * 100) / 100 : Math.round(n * 100) / 100;
}

export function unitLabel(unit) {
  return unit === 'lb' ? 'lb' : 'kg';
}
