import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpcionesDBService {
  private apiUrl = 'https://sca-omega.vercel.app/api/opciones/';

  constructor(private http: HttpClient) { }

  getItems(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getItem(id: number): Observable<any> { //id del area
    return this.http.get(`${'https://sca-omega.vercel.app/api/opciones/'}/${id}`); //devuelve todas las opciones de esa area
  }

  createItem(item: any): Observable<any> {
    return this.http.post('https://sca-omega.vercel.app/api/opcion/create/', item);
  }

  updateItem(id: number, item: any): Observable<any> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put(`${'https://sca-omega.vercel.app/api/opcion/update'}/${id}`, item, { headers: header });
  }

  deleteItem(id: number): Observable<void> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.delete<void>(`${'https://sca-omega.vercel.app/api/opcion/delete'}/${id}`, { headers: header });
  }

}

