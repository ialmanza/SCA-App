import { Injectable } from '@angular/core';
import { supabase } from '../config/supabase.config';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DecisionArea {
  id: string;
  rotulo: string;
  nombre_area: string;
  descripcion: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class DecisionAreaService {
  private decisionAreasSubject = new BehaviorSubject<DecisionArea[]>([]);
  public decisionAreas$ = this.decisionAreasSubject.asObservable();

  constructor() {
    this.loadDecisionAreas();
  }

  async loadDecisionAreas() {
    const { data, error } = await supabase
      .from('decision_areas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading decision areas:', error);
      return;
    }

    this.decisionAreasSubject.next(data || []);
  }

  async createDecisionArea(rotulo: string, nombre_area: string, descripcion: string): Promise<DecisionArea | null> {
    const { data, error } = await supabase
      .from('decision_areas')
      .insert([
        { rotulo, nombre_area, descripcion }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating decision area:', error);
      return null;
    }

    await this.loadDecisionAreas();
    return data;
  }

  async updateDecisionArea(id: string, updates: Partial<DecisionArea>): Promise<DecisionArea | null> {
    const { data, error } = await supabase
      .from('decision_areas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating decision area:', error);
      return null;
    }

    await this.loadDecisionAreas();
    return data;
  }

  async deleteDecisionArea(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('decision_areas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting decision area:', error);
      return false;
    }

    await this.loadDecisionAreas();
    return true;
  }
} 