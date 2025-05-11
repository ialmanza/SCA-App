import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    this.loadNotifications();
  }

  async loadNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    this.notificationsSubject.next(data || []);
  }

  async createNotification(notification: { project_id: string; message: string; type: 'success' | 'error' | 'info' }): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    await this.loadNotifications();
    return data;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    await this.loadNotifications();
    return true;
  }

  async clearNotifications(): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .neq('id', ''); // Delete all notifications

    if (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }

    await this.loadNotifications();
    return true;
  }

  async getNotificationsByProject(projectId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading notifications for project:', error);
      return [];
    }

    return data || [];
  }
} 