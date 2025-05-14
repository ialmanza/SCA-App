export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DecisionArea {
  id: string;
  project_id: string;
  rotulo: string;
  nombre_area: string;
  descripcion: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
}

export interface Opcion {
  id: string;
  descripcion: string;
  cod_area: string;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface ComparisonMode {
  id: string;
  project_id: string;
  order_num: number;
  peso: number;
  comparison_area: string;
  label: string;
  symbol: string;
  puntuacion_minima?: number;
  created_at: string;
  updated_at: string;
}

export interface ComparisonCell {
  id: string;
  opcion_id: string;
  mode_id: string;
  project_id: string;
  value: number;
  created_at: string;
  updated_at: string;
}

export interface Vinculo {
  id: string;
  area_id: string;
  related_area_id: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  area?: {
    nombre_area: string;
  };
  related_area?: {
    nombre_area: string;
  };
}

export interface Notification {
  id: string;
  project_id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  created_at: string;
} 