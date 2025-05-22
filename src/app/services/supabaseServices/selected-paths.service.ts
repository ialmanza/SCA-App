import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { Observable, from } from 'rxjs';

export interface SelectedPath {
  id: string;
  project_id: string;
  hex_code: string;
  path: string[];
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SelectedPathsService {

  constructor() { }

  // Obtener todos los caminos seleccionados para un proyecto
  getSelectedPathsByProject(projectId: string): Observable<SelectedPath[]> {
    return from(
      supabase
        .from('selected_paths')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error;
          return data as SelectedPath[];
        })
    );
  }

  // Obtener un camino específico por su ID
  getSelectedPath(pathId: string): Observable<SelectedPath> {
    return from(
      supabase
        .from('selected_paths')
        .select('*')
        .eq('id', pathId)
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return data as SelectedPath;
        })
    );
  }

  // Crear un nuevo camino seleccionado
  async createSelectedPath(
    projectId: string,
    hexCode: string,
    path: string[]
  ): Promise<SelectedPath> {
    const { data, error } = await supabase
      .from('selected_paths')
      .insert([{
        project_id: projectId,
        hex_code: hexCode,
        path: path
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating selected path:', error);
      throw error;
    }

    return data as SelectedPath;
  }

  // Actualizar un camino seleccionado
  async updateSelectedPath(
    pathId: string,
    updates: Partial<Pick<SelectedPath, 'hex_code' | 'path'>>
  ): Promise<SelectedPath> {
    const { data, error } = await supabase
      .from('selected_paths')
      .update(updates)
      .eq('id', pathId)
      .select()
      .single();

    if (error) {
      console.error('Error updating selected path:', error);
      throw error;
    }

    return data as SelectedPath;
  }

  // Eliminar un camino seleccionado
  async deleteSelectedPath(pathId: string): Promise<void> {
    const { error } = await supabase
      .from('selected_paths')
      .delete()
      .eq('id', pathId);

    if (error) {
      console.error('Error deleting selected path:', error);
      throw error;
    }
  }

  // Eliminar todos los caminos de un proyecto
  async deleteAllPathsByProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('selected_paths')
      .delete()
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting all paths for project:', error);
      throw error;
    }
  }
}
