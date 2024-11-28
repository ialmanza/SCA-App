import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ComparisonMode } from '../models/comparacion';

@Injectable({
  providedIn: 'root'
})
export class ComparisonModeService {
  private readonly STORAGE_KEY = 'comparison_modes';
  private comparisonModesSubject: BehaviorSubject<ComparisonMode[]>;

  constructor() {
    const storedModes = this.getStoredModes();
    this.comparisonModesSubject = new BehaviorSubject<ComparisonMode[]>(storedModes);
  }

  private getStoredModes(): ComparisonMode[] {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  }

  private updateStorage(modes: ComparisonMode[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(modes));
    this.comparisonModesSubject.next(modes);
  }

  getComparisonModes(): Observable<ComparisonMode[]> {
    return this.comparisonModesSubject.asObservable();
  }

  addComparisonMode(mode: Omit<ComparisonMode, 'id'>): void {
    const currentModes = this.getStoredModes();
    const newMode: ComparisonMode = {
      ...mode,
      id: Date.now().toString()
    };
    this.updateStorage([...currentModes, newMode]);
  }

  updateComparisonMode(mode: ComparisonMode): void {
    const currentModes = this.getStoredModes();
    const updatedModes = currentModes.map(m =>
      m.id === mode.id ? mode : m
    );
    this.updateStorage(updatedModes);
  }

  deleteComparisonMode(id: string): void {
    const currentModes = this.getStoredModes();
    const filteredModes = currentModes.filter(mode => mode.id !== id);
    this.updateStorage(filteredModes);
  }

  getComparisonModeById(id: string): ComparisonMode | undefined {
    const currentModes = this.getStoredModes();
    return currentModes.find(mode => mode.id === id);
  }
}
