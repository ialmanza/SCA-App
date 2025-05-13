import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { DecisionArea } from '../../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class DecisionAreaService {
  constructor() { }

  async getDecisionAreasByProject(projectId: string): Promise<DecisionArea[]> {
    const { data, error } = await supabase
      .from('decision_areas')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading decision areas:', error);
      throw error;
    }

    return data || [];
  }

  async createDecisionArea(projectId: string, decisionArea: Omit<DecisionArea, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Promise<DecisionArea> {
    const { data, error } = await supabase
      .from('decision_areas')
      .insert([{ ...decisionArea, project_id: projectId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating decision area:', error);
      throw error;
    }

    return data;
  }

  async updateDecisionArea(id: string, updates: Partial<Omit<DecisionArea, 'id' | 'project_id' | 'created_at' | 'updated_at'>>): Promise<DecisionArea> {
    const { data, error } = await supabase
      .from('decision_areas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating decision area:', error);
      throw error;
    }

    return data;
  }

  async deleteDecisionArea(id: string): Promise<void> {
    const { error } = await supabase
      .from('decision_areas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting decision area:', error);
      throw error;
    }
  }
} 