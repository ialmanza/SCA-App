import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ComparisonCell {
  id: string;
  opcion_id: string;
  mode_id: string;
  value: number;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComparisonCellService {
  private comparisonCellsSubject = new BehaviorSubject<ComparisonCell[]>([]);
  public comparisonCells$ = this.comparisonCellsSubject.asObservable();

  constructor() {
    this.loadComparisonCells();
  }

  async loadComparisonCells() {
    const { data, error } = await supabase
      .from('comparison_cells')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading comparison cells:', error);
      return;
    }

    this.comparisonCellsSubject.next(data || []);
  }

  async getCellsByOpcion(opcionId: string): Promise<ComparisonCell[]> {
    const { data, error } = await supabase
      .from('comparison_cells')
      .select('*')
      .eq('opcion_id', opcionId);

    if (error) {
      console.error('Error loading cells for option:', error);
      return [];
    }

    return data || [];
  }

  async getCellsByMode(modeId: string): Promise<ComparisonCell[]> {
    const { data, error } = await supabase
      .from('comparison_cells')
      .select('*')
      .eq('mode_id', modeId);

    if (error) {
      console.error('Error loading cells for mode:', error);
      return [];
    }

    return data || [];
  }

  async createComparisonCell(opcion_id: string, mode_id: string, value: number): Promise<ComparisonCell | null> {
    const { data, error } = await supabase
      .from('comparison_cells')
      .insert([
        { opcion_id, mode_id, value }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating comparison cell:', error);
      return null;
    }

    await this.loadComparisonCells();
    return data;
  }

  async updateComparisonCell(id: string, value: number): Promise<ComparisonCell | null> {
    const { data, error } = await supabase
      .from('comparison_cells')
      .update({ value })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating comparison cell:', error);
      return null;
    }

    await this.loadComparisonCells();
    return data;
  }

  async deleteComparisonCell(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('comparison_cells')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting comparison cell:', error);
      return false;
    }

    await this.loadComparisonCells();
    return true;
  }

  async upsertComparisonCell(opcion_id: string, mode_id: string, value: number): Promise<ComparisonCell | null> {
    const { data, error } = await supabase
      .from('comparison_cells')
      .upsert(
        { opcion_id, mode_id, value },
        { onConflict: 'opcion_id,mode_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting comparison cell:', error);
      return null;
    }

    await this.loadComparisonCells();
    return data;
  }

  async getComparisonCellsByProject(projectId: string): Promise<ComparisonCell[]> {
    const { data, error } = await supabase
      .from('comparison_cells')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error loading comparison cells for project:', error);
      return [];
    }

    return data || [];
  }
} 