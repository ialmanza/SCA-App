import { Opcion } from "./opcion";

export interface Decision {
  id: string;
  rotulo: string;
  area: string;
  description: string;
  opciones?: Opcion[];
  is_important?: boolean;
}
