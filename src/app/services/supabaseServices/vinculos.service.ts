import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { BehaviorSubject, Observable } from 'rxjs';
import { Vinculo, DecisionArea } from '../../models/interfaces';

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
      .select(`
        *,
        area:area_id(nombre_area),
        related_area:related_area_id(nombre_area)
      `)
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
      .select(`
        *,
        area:area_id(nombre_area),
        related_area:related_area_id(nombre_area)
      `)
      .or(`area_id.eq.${areaId},related_area_id.eq.${areaId}`);

    if (error) {
      console.error('Error loading links for area:', error);
      return [];
    }

    return data || [];
  }

  async createVinculo(projectId: string, area_id: string, related_area_id: string): Promise<Vinculo> {
    const { data, error } = await supabase
      .from('vinculos')
      .insert([{
        area_id,
        related_area_id,
        project_id: projectId
      }])
      .select(`
        *,
        area:area_id(nombre_area),
        related_area:related_area_id(nombre_area)
      `)
      .single();

    if (error) {
      console.error('Error creating link:', error);
      throw error;
    }

    await this.loadVinculos();
    return data;
  }

  async deleteVinculo(id: string): Promise<void> {
    const { error } = await supabase
      .from('vinculos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting link:', error);
      throw error;
    }

    await this.loadVinculos();
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
      .select(`
        *,
        area:area_id(nombre_area),
        related_area:related_area_id(nombre_area)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading links:', error);
      throw error;
    }

    return data || [];
  }
} 