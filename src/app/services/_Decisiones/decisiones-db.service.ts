import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, map } from 'rxjs';
import { Decision } from '../../models/decision';
import { json } from 'd3';

@Injectable({
  providedIn: 'root'
})
export class DecisionesDBService {
  private apiUrl = 'https://sca-v2b1.onrender.com/api/areas/';

  constructor(private http: HttpClient) { }

  getItems(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getItem(id: number): Observable<any> {
    return this.http.get(`${'https://sca-v2b1.onrender.com/api/area/'}/${id}/`);
  }

  createItem(item: any): Observable<any> {
    const payload = {
          rotulo: item.rotulo,
          area: item.area,
          description: item.description
        };
    return this.http.post('https://sca-v2b1.onrender.com/api/area/create/', payload);

  }

  updateItem(id: number, item: any): Observable<any> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put(`${'https://sca-v2b1.onrender.com/api/area/update'}/${id}/`, item, { headers: header });
  }

  deleteItem(id: number): Observable<void> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.delete<void>(`${'https://sca-v2b1.onrender.com/api/area/delete'}/${id}/`, { headers: header });
  }

  updateImportantStatus(decisionId: number, isImportant: boolean): Observable<Decision> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const updateData = {
      is_important: isImportant
    };

    return this.http.patch<Decision>(
      `https://sca-v2b1.onrender.com/api/area/update/${decisionId}/`,
      updateData,
      { headers: header }
    );
  }

  getImportantStatus(): Observable<any[]> {
    return this.http.get<any[]>(`https://sca-v2b1.onrender.com/api/areas/important/`);
  }

}
