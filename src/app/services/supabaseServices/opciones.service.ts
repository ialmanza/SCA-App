import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { BehaviorSubject, Observable } from 'rxjs';
import { Opcion } from '../../models/interfaces';

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
      throw error;
    }

    return data || [];
  }

  async createOpcion(projectId: string, descripcion: string, cod_area: string): Promise<Opcion> {
    const { data, error } = await supabase
      .from('opciones')
      .insert([{
        descripcion,
        cod_area,
        project_id: projectId
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating option:', error);
      throw error;
    }

    await this.loadOpciones();
    return data;
  }

  async updateOpcion(id: string, updates: Partial<Omit<Opcion, 'id' | 'project_id' | 'created_at' | 'updated_at'>>): Promise<Opcion> {
    const { data, error } = await supabase
      .from('opciones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating option:', error);
      throw error;
    }

    await this.loadOpciones();
    return data;
  }

  async deleteOpcion(id: string): Promise<void> {
    const { error } = await supabase
      .from('opciones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting option:', error);
      throw error;
    }

    await this.loadOpciones();
  }

  async getOpcionesByProject(projectId: string): Promise<Opcion[]> {
    const { data, error } = await supabase
      .from('opciones')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading options for project:', error);
      throw error;
    }

    return data || [];
  }
}
