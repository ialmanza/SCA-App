import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { Decision } from '../../models/decision';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DecisionsService {
  constructor() { }

  getDecisionsByProject(projectId: string): Observable<Decision[]> {
    return from(supabase
      .from('decision_areas')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return data as Decision[];
      }));
  }

  getDecision(id: string): Observable<Decision> {
    return from(supabase
      .from('decision_areas')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data as Decision;
      }));
  }

  createDecision(projectId: string, decision: Omit<Decision, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Observable<Decision> {
    return from(supabase
      .from('decision_areas')
      .insert([{ ...decision, project_id: projectId }])
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data as Decision;
      }));
  }

  updateDecision(id: string, decision: Partial<Omit<Decision, 'id' | 'project_id' | 'created_at' | 'updated_at'>>): Observable<Decision> {
    return from(supabase
      .from('decision_areas')
      .update(decision)
      .eq('id', id)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data as Decision;
      }));
  }

  deleteDecision(id: string): Observable<void> {
    return from(supabase
      .from('decision_areas')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) throw error;
      }));
  }

  getImportantStatus(projectId: string): Observable<Decision[]> {
    return from(supabase
      .from('decision_areas')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_important', true)
      .then(({ data, error }) => {
        if (error) throw error;
        return data as Decision[];
      }));
  }
}
