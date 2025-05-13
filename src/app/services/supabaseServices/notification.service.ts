import { Injectable } from '@angular/core';
import { supabase } from '../../config/supabase.config';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  project_id: string;
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
  private counter = 0;

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

  // Validador de UUID para garantizar que solo mandamos IDs en formato correcto
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  async createNotification(notification: {
    project_id: string;
    message: string;
    type: 'success' | 'error' | 'info'
  }): Promise<Notification | null> {
    try {
      // Asegurar que al menos tenemos un objeto de notificación
      if (!notification) {
        console.error('Error: objeto de notificación no proporcionado');
        return null;
      }

      // Validar que project_id sea un UUID válido
      const projectId = notification.project_id;

      if (!projectId || !this.isValidUUID(projectId)) {
        console.error('Error: project_id no válido o no tiene formato UUID', projectId);
        return null;
      }

      console.log('NotificationService recibió project_id válido:', projectId);

      // Verificar si project_id existe en la base de datos
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Error verificando acceso al proyecto:', projectError);
        return null;
      }

      if (!projectData) {
        console.error('No se encontró el proyecto o no tienes acceso');
        return null;
      }

      console.log('Proyecto verificado correctamente:', projectId);

      // Crear la notificación con el project_id verificado
      const notificationData = {
        project_id: projectId,
        message: notification.message || 'Notificación del sistema',
        type: notification.type || 'info',
        created_at: new Date().toISOString()
      };

      console.log('Insertando notificación con datos:', notificationData);

      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) {
        console.error('Error creando notificación:', error);
        return null;
      }

      console.log('Notificación creada con éxito:', data);
      await this.loadNotifications();
      return data;
    } catch (error) {
      console.error('Error en createNotification:', error);
      return null;
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando notificación:', error);
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
      console.error('Error limpiando notificaciones:', error);
      return false;
    }

    await this.loadNotifications();
    return true;
  }

  async getNotificationsByProject(projectId: string): Promise<Notification[]> {
    if (!projectId || !this.isValidUUID(projectId)) {
      console.error('Error: project_id no válido o no tiene formato UUID');
      return [];
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando notificaciones del proyecto:', error);
      return [];
    }

    return data || [];
  }
}
