import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { forkJoin, from, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface PathAreaScore {
  id?: string;
  project_id: string;
  path_id: string;
  decision_area_id: string;
  area_rotulo: string;
  score: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PathAreaScoreService {

  constructor() { }

  // Obtener todas las puntuaciones de áreas por camino para un proyecto
  async getProjectPathAreaScores(projectId: string): Promise<PathAreaScore[]> {
    try {
      const { data, error } = await supabase
        .from('path_area_scores')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error al obtener puntuaciones de áreas por camino:', error);
      return [];
    }
  }

  // Obtener puntuaciones de áreas para un camino específico
  async getPathAreaScores(pathId: string): Promise<PathAreaScore[]> {
    try {
      const { data, error } = await supabase
        .from('path_area_scores')
        .select('*')
        .eq('path_id', pathId);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error(`Error al obtener puntuaciones para el camino ${pathId}:`, error);
      return [];
    }
  }

  // Calcular y guardar puntuaciones de áreas para un camino
  async calculateAndSavePathAreaScores(
    projectId: string,
    pathId: string,
    hexCode: string,
    pathOptions: string[]
  ): Promise<PathAreaScore[]> {
    try {
      // 1. Obtener todos los modos de comparación (areas) para este proyecto
      const { data: comparisonModes, error: modesError } = await supabase
        .from('comparison_modes')
        .select('id, comparison_area, symbol, label, order_num')
        .eq('project_id', projectId);

      if (modesError) throw modesError;

      // 2. Obtener todas las celdas de comparación para las opciones del camino
      const { data: allCells, error: cellsError } = await supabase
        .from('comparison_cells')
        .select('opcion_id, mode_id, value')
        .eq('project_id', projectId);

      if (cellsError) throw cellsError;

      // 3. Obtener áreas de decisión para mapear IDs a rótulos
      const { data: decisionAreas, error: areasError } = await supabase
        .from('decision_areas')
        .select('id, rotulo')
        .eq('project_id', projectId);

      if (areasError) throw areasError;

      // 4. Obtener los IDs reales de las opciones a partir de las descripciones
      const { data: options, error: optionsError } = await supabase
        .from('opciones')
        .select('id, descripcion, cod_area')
        .eq('project_id', projectId);

      if (optionsError) throw optionsError;

      // Mapear descripción de opción a ID y área
      const optionMap = new Map();
      options.forEach(option => {
        optionMap.set(option.descripcion, {
          id: option.id,
          areaId: option.cod_area
        });
      });

      // Mapa para almacenar el rótulo de cada área de decisión
      const areaRotuloMap = new Map();
      decisionAreas.forEach(area => {
        areaRotuloMap.set(area.id, area.rotulo);
      });

      // 5. Calcular puntuaciones por área de comparación
      const areaScores = new Map();

      // Inicializar puntuaciones a 0 para todas las áreas de comparación
      comparisonModes.forEach(mode => {
        areaScores.set(mode.id, {
          areaId: mode.id,
          areaName: mode.comparison_area,
          score: 0,
          symbol: mode.symbol
        });
      });

      // Para cada opción en el camino
      for (const optionDescription of pathOptions) {
        // Buscar la opción por descripción
        const optionInfo = optionMap.get(optionDescription);

        if (!optionInfo) {
          console.warn(`No se encontró la opción con descripción: ${optionDescription}`);
          continue;
        }

        const optionId = optionInfo.id;

        // Buscar las celdas de comparación para esta opción
        const optionCells = allCells.filter(cell => cell.opcion_id === optionId);

        // Sumar los valores por área de comparación
        optionCells.forEach(cell => {
          const modeId = cell.mode_id;
          if (areaScores.has(modeId)) {
            const currentScore = areaScores.get(modeId);
            currentScore.score += Number(cell.value);
            areaScores.set(modeId, currentScore);
          }
        });
      }

      // 6. Guardar las puntuaciones en la base de datos
      const pathAreaScores: PathAreaScore[] = [];

      // Preparar registros para insertar/actualizar
      for (const [modeId, scoreInfo] of areaScores.entries()) {
        const mode = comparisonModes.find(m => m.id === modeId);
        if (!mode) continue;

        // Encontrar un área de decisión relacionada
        // Nota: Esto es una aproximación, puede necesitar ajustes según la estructura real
        const relevantArea = decisionAreas.find(area => {
          return mode.comparison_area.includes(area.rotulo) ||
                 area.rotulo.includes(mode.comparison_area);
        });

        const areaId = relevantArea ? relevantArea.id : null;
        const rotulo = mode.comparison_area;

        pathAreaScores.push({
          project_id: projectId,
          path_id: pathId,
          decision_area_id: areaId || '00000000-0000-0000-0000-000000000000', // ID genérico si no se encuentra
          area_rotulo: rotulo,
          score: scoreInfo.score
        });
      }

      // 7. Eliminar puntuaciones existentes para este camino
      await supabase
        .from('path_area_scores')
        .delete()
        .eq('path_id', pathId);

      // 8. Insertar nuevas puntuaciones
      const { data: insertedData, error: insertError } = await supabase
        .from('path_area_scores')
        .insert(pathAreaScores)
        .select();

      if (insertError) throw insertError;

      return insertedData || pathAreaScores;
    } catch (error) {
      console.error('Error al calcular y guardar puntuaciones de áreas:', error);
      return [];
    }
  }

  // Actualizar una puntuación específica
  async updatePathAreaScore(scoreId: string, newValue: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('path_area_scores')
        .update({ score: newValue })
        .eq('id', scoreId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error al actualizar puntuación:', error);
      return false;
    }
  }

  // Eliminar todas las puntuaciones de un camino
  async deletePathScores(pathId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('path_area_scores')
        .delete()
        .eq('path_id', pathId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error al eliminar puntuaciones del camino:', error);
      return false;
    }
  }
}
