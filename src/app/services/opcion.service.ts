import { Injectable } from '@angular/core';
import { Opcion } from '../models/opcion';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpcionService {
  private opcionesSubject: BehaviorSubject<Opcion[]> = new BehaviorSubject<Opcion[]>([])

  constructor() {
    this.loadOpcionesFromLocalStorage();
   }

   getOpciones():Observable<Opcion[]> {
    return this.opcionesSubject.asObservable();

   }

   addOpcion(opcion : Opcion) {
    const storedOpciones = this.getOpcionesFromLocalStorage();
    storedOpciones.push(opcion);
    this.saveOpcionesToLocalStorage(storedOpciones);
    this.opcionesSubject.next(storedOpciones);
   }

   deleteOpcion(id: string) {
    let storedOpciones = this.getOpcionesFromLocalStorage();
    storedOpciones = storedOpciones.filter((opcion: { _id: string; }) => opcion._id !== id);
    this.saveOpcionesToLocalStorage(storedOpciones);
    this.opcionesSubject.next(storedOpciones);

  }

  private getOpcionesFromLocalStorage(): Opcion[] {
    const storedOpciones = localStorage.getItem('opciones_areas');
    return storedOpciones ? JSON.parse(storedOpciones) : [];
  }


  private loadOpcionesFromLocalStorage() {
    const storedOpciones = this.getOpcionesFromLocalStorage();
    this.opcionesSubject.next(storedOpciones);
  }

  private saveOpcionesToLocalStorage(opciones: Opcion[]) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('opciones_areas', JSON.stringify(opciones));
    } else {
      console.warn('localStorage no disponible.');
    }
  }

  updateOpcion(updatedOpcion: Opcion) {
    let storedOpciones = this.getOpcionesFromLocalStorage();
    const index = storedOpciones.findIndex(opcion => opcion.id === updatedOpcion.id);
    if (index !== -1) {
      storedOpciones[index] = updatedOpcion;
        this.saveOpcionesToLocalStorage(storedOpciones);
        this.opcionesSubject.next(storedOpciones);
    } else {
        console.error('Opción no encontrada.');
    }
  }
}
