import { Injectable } from '@angular/core';
import { Decision } from '../models/decision';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DecisionService {
  private decisionesSubject: BehaviorSubject<Decision[]> = new BehaviorSubject<Decision[]>([])

  constructor() {
    this.loadDecisionesFromLocalStorage();
   }

   getDecisiones():Observable<Decision[]> {
    return this.decisionesSubject.asObservable();

   }

   addDecision(decision : Decision) {
    const storedDecisiones = this.getDecisionesFromLocalStorage();
    storedDecisiones.push(decision);
    this.saveDecisionesToLocalStorage(storedDecisiones);
    this.decisionesSubject.next(storedDecisiones);
   }

   deleteDecision(id: string) {
    let storedDecisiones = this.getDecisionesFromLocalStorage();
    storedDecisiones = storedDecisiones.filter((decision: { id: string; }) => decision.id !== id);
    this.saveDecisionesToLocalStorage(storedDecisiones);
    this.decisionesSubject.next(storedDecisiones);

  }


  private getDecisionesFromLocalStorage(): Decision[] {
    const storedDecisiones = localStorage.getItem('areas_decisiones');
    return storedDecisiones ? JSON.parse(storedDecisiones) : [];
  }


  private loadDecisionesFromLocalStorage() {
    const storedDecisiones = this.getDecisionesFromLocalStorage();
    this.decisionesSubject.next(storedDecisiones);
  }

  private saveDecisionesToLocalStorage(decisiones: Decision[]) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('areas_decisiones', JSON.stringify(decisiones));
    } else {
      console.warn('localStorage no disponible.');
    }
  }

  updateDecision(updatedDecision: Decision) {
    let storedDecisiones = this.getDecisionesFromLocalStorage();
    const index = storedDecisiones.findIndex(decision => decision.id === updatedDecision.id);
    if (index !== -1) {
      storedDecisiones[index] = updatedDecision;
        this.saveDecisionesToLocalStorage(storedDecisiones);
        this.decisionesSubject.next(storedDecisiones);
    } else {
        console.error('Decisión no encontrada.');
    }
  }


}
