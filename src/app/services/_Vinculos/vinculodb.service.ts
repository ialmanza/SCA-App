import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VinculodbService {
  private apiUrl = 'https://sca-v2b1.onrender.com/api/areas/vinculos/';

  constructor(private http: HttpClient) { }

  getItems(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createItem(item1: number, item2: number): Observable<any> {
    const payload = {
          "area_id": item1,
          "related_area_id": item2
        };
    return this.http.post('https://sca-v2b1.onrender.com/api/areas/vinculo/', payload);

  }

  updateItem(id: number, item: any): Observable<any> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put(`${'https://sca-v2b1.onrender.com/api/area/update'}/${id}/`, item, { headers: header });
  }

  deleteItem(area_id: number, related_area_id: number): Observable<void> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const payload = {
      area_id: area_id,
      related_area_id: related_area_id
    };

    return this.http.delete<void>('https://sca-v2b1.onrender.com/api/areas/vinculo/', {
      headers: headers,
      body: payload
    });
}

}
