import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpcionesDBService {
  private apiUrl = 'https://sca-v2b1.onrender.com/api/opciones/';

  constructor(private http: HttpClient) { }

  getItems(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getItem(id: number): Observable<any> { //id del area
    return this.http.get(`${'https://sca-v2b1.onrender.com/api/opciones/'}/${id}/`); //devuelve todas las opciones de esa area
  }

  createItem(item: any): Observable<any> {
    const payload = {
          descripcion: item.descripcion,
          cod_area: item.cod_area
        };
    return this.http.post('https://sca-v2b1.onrender.com/api/opcion/create/', payload);

  }

  updateItem(id: number, item: any): Observable<any> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put(`${'https://sca-v2b1.onrender.com/api/opcion/update'}/${id}/`, item, { headers: header });
  }

  deleteItem(id: number): Observable<void> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.delete<void>(`${'https://sca-v2b1.onrender.com/api/opcion/delete'}/${id}/`, { headers: header });
  }

  updateComparacionValue(opcionId: string, modeId: string, value: string): Observable<any> {
    const payload = {
      opcionId: opcionId,
      modeId: modeId,
      value: value
    };
    return this.http.post('https://sca-v2b1.onrender.com/api/comparacion/update-value', payload);
  }
}

