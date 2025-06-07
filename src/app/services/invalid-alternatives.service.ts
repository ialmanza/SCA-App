import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PathValues {
  id: string;
  hexa: string;
  path: string[];
  descriptions?: string[];
  values: {
    area: string;
    symbol: string;
    value: number;
    isValid: boolean;
    minScore: number | null;
    maxScore: number | null;
    isInValidRange: boolean;
  }[];
  areaScores?: { [areaName: string]: number };
  conflictingAreas?: string[];
  hasConflicts?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InvalidAlternativesService {
  private invalidAlternativesSubject = new BehaviorSubject<PathValues[]>([]);
  invalidAlternatives$ = this.invalidAlternativesSubject.asObservable();

  constructor() { }

  setInvalidAlternatives(alternatives: PathValues[]): void {
    this.invalidAlternativesSubject.next(alternatives);
  }

  getInvalidAlternatives(): PathValues[] {
    return this.invalidAlternativesSubject.value;
  }

  clearInvalidAlternatives(): void {
    this.invalidAlternativesSubject.next([]);
  }
} 