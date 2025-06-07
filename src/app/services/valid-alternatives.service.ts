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
export class ValidAlternativesService {
  private validAlternativesSubject = new BehaviorSubject<PathValues[]>([]);
  validAlternatives$ = this.validAlternativesSubject.asObservable();

  constructor() { }

  setValidAlternatives(alternatives: PathValues[]): void {
    this.validAlternativesSubject.next(alternatives);
  }

  getValidAlternatives(): PathValues[] {
    return this.validAlternativesSubject.value;
  }

  clearValidAlternatives(): void {
    this.validAlternativesSubject.next([]);
  }
} 