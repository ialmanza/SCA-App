import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ComparisonMode {
  id: string;
  project_id: string;
  order_num: number;
  peso: number;
  comparison_area: string;
  label: string;
  symbol: string;
  puntuacion_minima?: number;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComparisonModeService {
  private comparisonModesSubject = new BehaviorSubject<ComparisonMode[]>([]);
  public comparisonModes$ = this.comparisonModesSubject.asObservable();

  constructor() {}

  async loadComparisonModes(projectId: string) {
    const { data, error } = await supabase
      .from('comparison_modes')
      .select('*')
      .eq('project_id', projectId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('Error loading comparison modes:', error);
      return;
    }

    this.comparisonModesSubject.next(data || []);
  }

  async createComparisonMode(mode: Omit<ComparisonMode, 'id' | 'created_at' | 'updated_at'>): Promise<ComparisonMode | null> {
    const { data, error } = await supabase
      .from('comparison_modes')
      .insert([mode])
      .select()
      .single();

    if (error) {
      console.error('Error creating comparison mode:', error);
      return null;
    }

    await this.loadComparisonModes(mode.project_id);
    return data;
  }

  async updateComparisonMode(id: string, updates: Partial<ComparisonMode>): Promise<ComparisonMode | null> {
    const { data, error } = await supabase
      .from('comparison_modes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating comparison mode:', error);
      return null;
    }

    if (data) {
      await this.loadComparisonModes(data.project_id);
    }
    return data;
  }

  async deleteComparisonMode(id: string): Promise<boolean> {
    // First get the project_id before deleting
    const { data: mode } = await supabase
      .from('comparison_modes')
      .select('project_id')
      .eq('id', id)
      .single();

    if (!mode) {
      return false;
    }

    const { error } = await supabase
      .from('comparison_modes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting comparison mode:', error);
      return false;
    }

    await this.loadComparisonModes(mode.project_id);
    return true;
  }

  async updatePuntuacionMinima(id: string, puntuacion_minima: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('comparison_modes')
      .update({ puntuacion_minima })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating minimum score:', error);
      return false;
    }

    if (data) {
      await this.loadComparisonModes(data.project_id);
    }
    return true;
  }

  async getComparisonModesByProject(projectId: string): Promise<ComparisonMode[]> {
    const { data, error } = await supabase
      .from('comparison_modes')
      .select('*')
      .eq('project_id', projectId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('Error loading comparison modes for project:', error);
      return [];
    }

    return data || [];
  }
} 