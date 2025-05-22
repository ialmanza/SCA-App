import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';

// Interfaz para los datos de path_descriptions
export interface PathDescription {
  id: string;
  project_id: string;
  hex_code: string;
  path_descriptions: string[];
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class PathDescriptionsService {
  constructor() {}

  async savePathDescription(projectId: string, hexCode: string, descriptions: string[]): Promise<void> {
    // Primero intentamos verificar si ya existe un registro
    const { data: existingData, error: existingError } = await supabase
      .from('path_descriptions')
      .select('id')
      .eq('project_id', projectId)
      .eq('hex_code', hexCode);

    if (existingError) throw existingError;

    // Si ya existe, actualizamos
    if (existingData && existingData.length > 0) {
      // Si hay múltiples registros, eliminamos todos menos el primero
      if (existingData.length > 1) {
        // Mantenemos el primer registro
        const keepId = existingData[0].id;

        // Eliminamos los demás
        const idsToDelete = existingData
          .slice(1)
          .map(row => row.id);

        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('path_descriptions')
            .delete()
            .in('id', idsToDelete);

          if (deleteError) throw deleteError;
        }

        // Actualizamos el registro que mantuvimos
        const { error: updateError } = await supabase
          .from('path_descriptions')
          .update({ path_descriptions: descriptions })
          .eq('id', keepId);

        if (updateError) throw updateError;
      } else {
        // Solo hay un registro, lo actualizamos normalmente
        const { error: updateError } = await supabase
          .from('path_descriptions')
          .update({ path_descriptions: descriptions })
          .eq('project_id', projectId)
          .eq('hex_code', hexCode);

        if (updateError) throw updateError;
      }
    } else {
      // Si no existe, insertamos un nuevo registro
      const { error: insertError } = await supabase
        .from('path_descriptions')
        .insert({
          project_id: projectId,
          hex_code: hexCode,
          path_descriptions: descriptions
        });

      if (insertError) throw insertError;
    }
  }

  async getPathDescription(projectId: string, hexCode: string): Promise<string[] | null> {
    // En lugar de .single(), usamos .limit(1) para obtener solo el primer registro
    const { data, error } = await supabase
      .from('path_descriptions')
      .select('path_descriptions')
      .eq('project_id', projectId)
      .eq('hex_code', hexCode)
      .limit(1);

    if (error) throw error;

    // Si no hay datos o el array está vacío, devolvemos null
    if (!data || data.length === 0) return null;

    // Devolvemos las descripciones del primer registro
    return data[0]?.path_descriptions || null;
  }

  async deletePathDescription(projectId: string, hexCode: string): Promise<void> {
    const { error } = await supabase
      .from('path_descriptions')
      .delete()
      .eq('project_id', projectId)
      .eq('hex_code', hexCode);

    if (error) throw error;
  }

  // NUEVO MÉTODO para el componente de elección
  async getAllPathDescriptionsByProject(projectId: string): Promise<PathDescription[]> {
    const { data, error } = await supabase
      .from('path_descriptions')
      .select('*')
      .eq('project_id', projectId)
      .order('hex_code');

    if (error) throw error;

    return data || [];
  }

  // NUEVO MÉTODO alternativo que devuelve solo los campos necesarios
  async getPathDescriptionsForElection(projectId: string): Promise<{
    id: string;
    hex_code: string;
    path_descriptions: string[];
  }[]> {
    const { data, error } = await supabase
      .from('path_descriptions')
      .select('id, hex_code, path_descriptions')
      .eq('project_id', projectId)
      .order('hex_code');

    if (error) throw error;

    return data || [];
  }
}
