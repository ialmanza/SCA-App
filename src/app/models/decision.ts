import { Opcion } from "./opcion";

export interface Decision {
  _id: string;
  rotulo: string;
  area: string;
  description: string;
  opciones?: Opcion[];
  is_important?: boolean;
  id?: number;
}
