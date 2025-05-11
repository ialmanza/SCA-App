import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Opcion {
  id: string;
  descripcion: string;
  cod_area: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpcionesService {
  private opcionesSubject = new BehaviorSubject<Opcion[]>([]);
  public opciones$ = this.opcionesSubject.asObservable();

  constructor() {
    this.loadOpciones();
  }

  async loadOpciones() {
    const { data, error } = await supabase
      .from('opciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading options:', error);
      return;
    }

    this.opcionesSubject.next(data || []);
  }

  async getOpcionesByArea(areaId: string): Promise<Opcion[]> {
    const { data, error } = await supabase
      .from('opciones')
      .select('*')
      .eq('cod_area', areaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading options for area:', error);
      return [];
    }

    return data || [];
  }

  async createOpcion(descripcion: string, cod_area: string): Promise<Opcion | null> {
    const { data, error } = await supabase
      .from('opciones')
      .insert([
        { descripcion, cod_area }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating option:', error);
      return null;
    }

    await this.loadOpciones();
    return data;
  }

  async updateOpcion(id: string, updates: Partial<Opcion>): Promise<Opcion | null> {
    const { data, error } = await supabase
      .from('opciones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating option:', error);
      return null;
    }

    await this.loadOpciones();
    return data;
  }

  async deleteOpcion(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('opciones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting option:', error);
      return false;
    }

    await this.loadOpciones();
    return true;
  }

  async getOpcionesByProject(projectId: string): Promise<Opcion[]> {
    const { data, error } = await supabase
      .from('opciones')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading options for project:', error);
      return [];
    }

    return data || [];
  }
} 