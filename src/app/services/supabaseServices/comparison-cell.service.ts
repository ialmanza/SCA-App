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
}
