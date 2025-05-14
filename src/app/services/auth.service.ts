import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { supabase } from '../config/supabase.config';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    this.loadUser();
  }

  private async loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    this.currentUser.next(user);
  }

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    this.currentUser.next(data.user);
    return data;
  }

  // async signOut() {
  //   const { error } = await supabase.auth.signOut();
  //   if (error) throw error;
  //   this.currentUser.next(null);
  // }

  async signOut() {
    // 1. Primero limpiamos cualquier dato de sesión en localStorage
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('currentProject');
    // Limpia cualquier otro dato relevante que estés guardando

    // 2. Limpiamos el estado de la aplicación
    this.currentUser.next(null);

    // 3. Luego realizamos el signOut de Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return true;
  }

  isAuthenticated(): boolean {
    return this.currentUser.value !== null;
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable();
  }
}
