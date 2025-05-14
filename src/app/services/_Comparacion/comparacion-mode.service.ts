import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { ComparisonMode } from '../../models/comparacion';
import { supabase } from '../../config/supabase.config';

@Injectable({
  providedIn: 'root'
})
export class ComparacionModeService {
  constructor() {}

  async getComparisonModesByProject(projectId: string): Promise<ComparisonMode[]> {
    const { data, error } = await supabase
      .from('comparison_modes')
      .select('*')
      .eq('project_id', projectId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('Error loading comparison modes:', error);
      throw error;
    }

    return data || [];
  }

  async createComparisonMode(mode: Partial<ComparisonMode>): Promise<ComparisonMode> {
    const { data, error } = await supabase
      .from('comparison_modes')
      .insert([mode])
      .select()
      .single();

    if (error) {
      console.error('Error creating comparison mode:', error);
      throw error;
    }

    return data;
  }

  async updateComparisonMode(id: string, mode: Partial<ComparisonMode>): Promise<ComparisonMode> {
    const { data, error } = await supabase
      .from('comparison_modes')
      .update(mode)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating comparison mode:', error);
      throw error;
    }

    return data;
  }

  async deleteComparisonMode(id: string): Promise<void> {
    const { error } = await supabase
      .from('comparison_modes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting comparison mode:', error);
      throw error;
    }
  }

  async updatePuntuacionMinima(id: string, puntuacion: number): Promise<ComparisonMode> {
    const { data, error } = await supabase
      .from('comparison_modes')
      .update({ puntuacion_minima: puntuacion })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating minimum score:', error);
      throw error;
    }

    return data;
  }
}

