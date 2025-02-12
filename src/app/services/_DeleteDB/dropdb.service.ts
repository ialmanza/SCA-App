import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DropdbService {

  private apiUrl = 'https://sca-v2b1.onrender.com/reset-db/';

  constructor(private http: HttpClient) { }

  dropDB(): Observable<any> {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.delete<any>(this.apiUrl, { headers: header });
  }

}
