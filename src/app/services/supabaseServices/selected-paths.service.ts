import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { supabase } from '../../config/supabase.config'; // Importa directamente tu instancia de supabase

@Injectable({
  providedIn: 'root'
})
export class SelectedPathsService {
  constructor() {}

  getPathsFromBackend(projectId: string): Observable<any[]> {
    return from(supabase
      .from('selected_paths')
      .select('*')
      .eq('project_id', projectId)
      .then(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }));
  }

  addPathToBackend(hexCode: string, path: string[], projectId: string): Observable<any> {
    return from(supabase
      .from('selected_paths')
      .insert({
        hex_code: hexCode,
        path: path,
        project_id: projectId
      })
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }));
  }

  deletePathFromBackend(pathId: string, hexCode: string, projectId: string): Observable<any> {
    return from(supabase
      .from('selected_paths')
      .delete()
      .eq('id', pathId)
      .eq('project_id', projectId)
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }));
  }
}
