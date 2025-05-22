import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

interface ComparisonModeWithCells {
  id: string;
  puntuacion_minima: number | null;
  comparison_cells: {
    opcion_id: string;
    value: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ComparisonCellService {
  constructor() {}

  getComparisonCellsByProject(projectId: string): Observable<any[]> {
    return from(
      supabase
        .from('comparison_cells')
        .select('*')
        .eq('project_id', projectId)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      })
    );
  }

  async upsertComparisonCell(
    opcionId: string,
    modeId: string,
    value: number,
    projectId: string
  ): Promise<any> {
    // Primero verificamos si la celda ya existe
    const { data: existingCells, error: fetchError } = await supabase
      .from('comparison_cells')
      .select('*')
      .eq('opcion_id', opcionId)
      .eq('mode_id', modeId)
      .eq('project_id', projectId);

    if (fetchError) {
      console.error('Error checking existing cell:', fetchError);
      throw fetchError;
    }

    // Si la celda existe, actualizamos su valor
    if (existingCells && existingCells.length > 0) {
      const { data, error } = await supabase
        .from('comparison_cells')
        .update({ value })
        .eq('opcion_id', opcionId)
        .eq('mode_id', modeId)
        .eq('project_id', projectId)
        .select()
        .single();

      if (error) {
        console.error('Error updating comparison cell:', error);
        throw error;
      }

      return data;
    }
    // Si no existe, creamos una nueva celda
    else {
      const newCell = {
        opcion_id: opcionId,
        mode_id: modeId,
        value,
        project_id: projectId
      };

      const { data, error } = await supabase
        .from('comparison_cells')
        .insert([newCell])
        .select()
        .single();

      if (error) {
        console.error('Error creating comparison cell:', error);
        throw error;
      }

      return data;
    }
  }

  async deleteComparisonCellsByProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('comparison_cells')
      .delete()
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting comparison cells:', error);
      throw error;
    }
  }

  getCellsWithMinimumScores(projectId: string): Observable<Map<string, Set<string>>> {
    return from(
      supabase
        .from('comparison_modes')
        .select(`
          id,
          puntuacion_minima,
          comparison_cells (
            opcion_id,
            value
          )
        `)
        .eq('project_id', projectId)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        const validOptionsMap = new Map<string, Set<string>>();

        (response.data as ComparisonModeWithCells[]).forEach(mode => {
          const minScore = mode.puntuacion_minima;
          if (minScore !== null) {
            const validOptions = new Set<string>();

            mode.comparison_cells.forEach(cell => {
              if (cell.value >= minScore) {
                validOptions.add(cell.opcion_id);
              }
            });

            validOptionsMap.set(mode.id, validOptions);
          }
        });

        return validOptionsMap;
      })
    );
  }

  // Agregar este método a tu ComparisonCellService

  // async getCellsWithMinimumScores(projectId: string): Promise<Map<string, Set<string>>> {
  //   try {
  //     // Obtener los modos de comparación con sus puntuaciones mínimas
  //     const { data: comparisonModes, error: modesError } = await supabase
  //       .from('comparison_modes')
  //       .select('id, puntuacion_minima')
  //       .eq('project_id', projectId);

  //     if (modesError) throw modesError;

  //     // Obtener todas las celdas de comparación del proyecto
  //     const { data: cells, error: cellsError } = await supabase
  //       .from('comparison_cells')
  //       .select('opcion_id, mode_id, value')
  //       .eq('project_id', projectId);

  //     if (cellsError) throw cellsError;

  //     // Crear el mapa de opciones válidas por modo
  //     const validOptionsMap = new Map<string, Set<string>>();

  //     comparisonModes.forEach(mode => {
  //       const validOptions = new Set<string>();

  //       // Filtrar celdas que cumplan con la puntuación mínima (si existe)
  //       const modeCells = cells.filter(cell => cell.mode_id === mode.id);

  //       modeCells.forEach(cell => {
  //         const cellValue = Number(cell.value);
  //         const minScore = mode.puntuacion_minima;

  //         // Si no hay puntuación mínima o la celda cumple con la mínima
  //         if (minScore === null || minScore === undefined || cellValue >= minScore) {
  //           validOptions.add(cell.opcion_id);
  //         }
  //       });

  //       validOptionsMap.set(mode.id, validOptions);
  //     });

  //     return validOptionsMap;
  //   } catch (error) {
  //     console.error('Error al obtener celdas con puntuaciones mínimas:', error);
  //     return new Map();
  //   }
  // }
}
