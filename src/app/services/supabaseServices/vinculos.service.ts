import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Vinculo {
  id: string;
  area_id: string;
  related_area_id: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class VinculosService {
  private vinculosSubject = new BehaviorSubject<Vinculo[]>([]);
  public vinculos$ = this.vinculosSubject.asObservable();

  constructor() {
    this.loadVinculos();
  }

  async loadVinculos() {
    const { data, error } = await supabase
      .from('vinculos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading links:', error);
      return;
    }

    this.vinculosSubject.next(data || []);
  }

  async getVinculosByArea(areaId: string): Promise<Vinculo[]> {
    const { data, error } = await supabase
      .from('vinculos')
      .select('*')
      .or(`area_id.eq.${areaId},related_area_id.eq.${areaId}`);

    if (error) {
      console.error('Error loading links for area:', error);
      return [];
    }

    return data || [];
  }

  async createVinculo(area_id: string, related_area_id: string): Promise<Vinculo | null> {
    const { data, error } = await supabase
      .from('vinculos')
      .insert([
        { area_id, related_area_id }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating link:', error);
      return null;
    }

    await this.loadVinculos();
    return data;
  }

  async deleteVinculo(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('vinculos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting link:', error);
      return false;
    }

    await this.loadVinculos();
    return true;
  }

  async deleteVinculosByArea(areaId: string): Promise<boolean> {
    const { error } = await supabase
      .from('vinculos')
      .delete()
      .or(`area_id.eq.${areaId},related_area_id.eq.${areaId}`);

    if (error) {
      console.error('Error deleting links for area:', error);
      return false;
    }

    await this.loadVinculos();
    return true;
  }

  async getVinculosByProject(projectId: string): Promise<Vinculo[]> {
    const { data, error } = await supabase
      .from('vinculos')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error loading vinculos for project:', error);
      return [];
    }

    return data || [];
  }
} 