import { Opcion } from "./interfaces";

export interface Decision {
  id: string;
  project_id: string;
  rotulo: string;
  nombre_area: string;
  descripcion: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
  opciones?: Opcion[];
}
