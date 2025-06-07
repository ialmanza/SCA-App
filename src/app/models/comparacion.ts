export interface ComparisonMode {
  id: string;
  project_id: string;
  order_num: number;
  peso: number;
  comparison_area: string;
  label: string;
  symbol: string;
  puntuacion_minima?: number;
  puntuacion_maxima?: number;
  created_at?: string;
  updated_at?: string;
}
