export interface ColorScheme {
  id: string;
  label: string;
  strong: [number, number, number];
  light: [number, number, number];
  hex: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  { id: 'blue',   label: 'Azul',     strong: [41, 128, 185],   light: [235, 245, 251], hex: '#2980B9' },
  { id: 'green',  label: 'Verde',    strong: [39, 174, 96],    light: [233, 247, 239], hex: '#27AE60' },
  { id: 'red',    label: 'Rojo',     strong: [231, 76, 60],    light: [253, 237, 236], hex: '#E74C3C' },
  { id: 'yellow', label: 'Amarillo', strong: [212, 172, 13],   light: [254, 249, 231], hex: '#D4AC0D' },
  { id: 'purple', label: 'Morado',   strong: [142, 68, 173],   light: [245, 238, 248], hex: '#8E44AD' },
];

export const DEFAULT_COLOR_SCHEME = COLOR_SCHEMES[0];
