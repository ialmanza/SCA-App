import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { ComparisonCell } from '../../models/comparison-cell';



@Injectable({
  providedIn: 'root'
})
export class ComparisonCellService {
  private apiUrl = 'https://sca-v2b1.onrender.com/api/comparison-cells/';

  constructor(private http: HttpClient) {}

  // Obtener todas las celdas
  getCells(): Observable<ComparisonCell[]> {
    return this.http.get<ComparisonCell[]>(this.apiUrl);
  }

  // Crear múltiples celdas
  createCells(cells: ComparisonCell[]): Observable<ComparisonCell[]> {
    return this.http.post<ComparisonCell[]>(`${this.apiUrl}bulk-create/`, cells);
  }

  // Actualizar una celda
  updateCell(cell: ComparisonCell): Observable<ComparisonCell> {
    return this.http.put<ComparisonCell>(`${this.apiUrl}${cell.id}/`, cell);
  }

  // Actualizar múltiples celdas
  updateCells(cells: ComparisonCell[]): Observable<ComparisonCell[]> {
    return this.http.put<ComparisonCell[]>(`${this.apiUrl}bulk-update/`, cells);
  }
}
