import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { supabase } from '../../config/supabase.config';

export interface Project {
  id?: string;
  user_id: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor() { }

  getProjects(): Observable<Project[]> {
    return from(supabase
      .from('projects')
      .select('*')
      .then(({ data, error }) => {
        if (error) throw error;
        return data as Project[];
      }));
  }

  getProject(id: string): Observable<Project> {
    return from(supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data as Project;
      }));
  }

  createProject(project: Project): Observable<Project> {
    return from(supabase
      .from('projects')
      .insert(project)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data as Project;
      }));
  }

  updateProject(id: string, project: Partial<Project>): Observable<Project> {
    return from(supabase
      .from('projects')
      .update(project)
      .eq('id', id)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data as Project;
      }));
  }

  deleteProject(id: string): Observable<void> {
    return from(supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) throw error;
      }));
  }
}
