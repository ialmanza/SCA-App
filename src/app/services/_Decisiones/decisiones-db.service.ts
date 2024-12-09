import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DecisionesDBService {
  private apiUrl = 'https://sca-omega.vercel.app/api/areas/';

  constructor(private http: HttpClient) { }

  getItems(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getItem(id: number): Observable<any> {
    return this.http.get(`${'https://sca-omega.vercel.app/api/area/'}/${id}`);
  }

  createItem(item: any): Observable<any> {
    console.log(item, 'item en servicio');
    console.log('creando area en el servicio');
    const payload = {
          rotulo: item.rotulo,
          area: item.area,
          description: item.description
        };
    return this.http.post('https://sca-omega.vercel.app/api/area/create/', payload);

  }

  updateItem(id: number, item: any): Observable<any> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put(`${'https://sca-omega.vercel.app/api/area/update'}/${id}`, item, { headers: header });
  }

  deleteItem(id: number): Observable<void> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.delete<void>(`${'https://sca-omega.vercel.app/api/area/delete'}/${id}`, { headers: header });
  }

}
