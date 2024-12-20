import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ComparisonMode } from '../../models/comparacion';

@Injectable({
  providedIn: 'root'
})
export class ComparacionModeService {
  private apiUrl = 'https://sca-omega.vercel.app/api/comparaciones/';

  constructor(private http: HttpClient) { }

  // Método específico para obtener los modos de comparación
  getComparisonModes(): Observable<ComparisonMode[]> {
    return this.http.get<ComparisonMode[]>(this.apiUrl);
  }

  getItems(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createItem(item: any): Observable<any> {
    return this.http.post('https://sca-omega.vercel.app/api/comparacion/create/', item);
  }

  updateItem(id: number, item: any): Observable<any> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put(`${'https://sca-omega.vercel.app/api/comparacion/update'}/${id}`, item, { headers: header });
  }

  deleteItem(id: number): Observable<void> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.delete<void>(`${'https://sca-omega.vercel.app/api/comparacion/delete'}/${id}`, { headers: header });
  }

  updatePuntuacionMinima(id: number, puntuacion: number): Observable<any> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const updateData = {
      puntuacion_minima: puntuacion
    };

    console.log("url",`${'https://sca-omega.vercel.app/api/comparacion/update/'}${id}/`);

    console.log("updateData",typeof updateData, updateData);
    return this.http.patch(
      `${'https://sca-omega.vercel.app/api/comparacion/update/'}${id}/`,
      updateData,
      { headers: header }
    );
  }

}

