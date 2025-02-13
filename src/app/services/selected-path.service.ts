import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface PathSelection {
  hexCode: string;
  path: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SelectedPathsService {
  private selectedPathsSubject = new BehaviorSubject<PathSelection[]>([]);
  private apiUrl = 'https://sca-v2b1.onrender.com/api/alternativas/'

  constructor(private http: HttpClient) { }

  public handlePathSelection(hexCode: string, path: string[], isSelected: boolean): void {
    if (isSelected) {
      this.addPathToBackend(hexCode, path).subscribe();
    } else {
      console.log('Eliminando path service:', path);
    }
  }

public addPathToBackend(hexCode: string, path: string[]): Observable<any> {
  const payload = {
    hexa: hexCode,
    options: path
  };

  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  return this.http.post('https://sca-v2b1.onrender.com/api/alternativa/create/', payload, { headers }).pipe(
    tap(response => {
      const currentPaths = this.selectedPathsSubject.value;
      this.selectedPathsSubject.next([...currentPaths, { hexCode, path }]);
    }),
    catchError(error => {
      return throwError(() => new Error(error));
    })
  );
}

public deletePathFromBackend(id: string, hexCode: string): Observable<any> {
  let id_number = parseInt(id, 10);
  return this.http.delete(`https://sca-v2b1.onrender.com/api/alternativa/delete/${hexCode}/`).pipe(
    tap(response => {
      const currentPaths = this.selectedPathsSubject.value;
      const updatedPaths = currentPaths.filter(p => p.hexCode !== hexCode);
      this.selectedPathsSubject.next(updatedPaths);
    }),
    catchError(error => {
      return throwError(() => new Error(error));
    })
  );
}

  public getPathsFromBackend(): Observable<any[]> {
    return this.http.get<PathSelection[]>(this.apiUrl).pipe(
      tap(paths => {
        this.selectedPathsSubject.next(paths);
      }),
      catchError(error => {
        return throwError(() => new Error(error));
      })
    );
  }
}
