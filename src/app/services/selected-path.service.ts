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
      // Si está seleccionado, añadir el path al backend
      console.log('Anadiendo path service:', path);
      this.addPathToBackend(hexCode, path).subscribe();
    } else {
      // Si no está seleccionado, eliminar el path del backend
      console.log('Eliminando path service:', path);
      //this.deletePathFromBackend(hexCode).subscribe();
    }
  }

public addPathToBackend(hexCode: string, path: string[]): Observable<any> {
  const payload = {
    hexa: hexCode,
    options: path
  };

  console.log("PAYLOAD EN servicio",payload, typeof payload.options);
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  return this.http.post('https://sca-v2b1.onrender.com/api/alternativa/create/', payload, { headers }).pipe(
    tap(response => {
      const currentPaths = this.selectedPathsSubject.value;
      this.selectedPathsSubject.next([...currentPaths, { hexCode, path }]);
      console.log('Alternativa creada:', response);
    }),
    catchError(error => {
      console.error('Error al crear alternativa:', error);
      return throwError(() => new Error(error));
    })
  );
}

public deletePathFromBackend(id: string, hexCode: string): Observable<any> {
  console.log('Eliminando alternativa con hexCode:', typeof id, id);
  console.log(`https://sca-v2b1.onrender.com/api/alternativa/delete/${id}/`);
  let id_number = parseInt(id, 10);
  console.log(typeof id_number, id_number);
  console.log(`https://sca-v2b1.onrender.com/api/alternativa/delete/${id_number}/`);
  return this.http.delete(`https://sca-v2b1.onrender.com/api/alternativa/delete/${hexCode}/`).pipe(
    tap(response => {
      const currentPaths = this.selectedPathsSubject.value;
      const updatedPaths = currentPaths.filter(p => p.hexCode !== hexCode);
      this.selectedPathsSubject.next(updatedPaths);
      console.log('Alternativa eliminada:', response);
    }),
    catchError(error => {
      console.error('Error al eliminar alternativa:', error);
      return throwError(() => new Error(error));
    })
  );
}

  public getPathsFromBackend(): Observable<any[]> {
    return this.http.get<PathSelection[]>(this.apiUrl).pipe(
      tap(paths => {
        this.selectedPathsSubject.next(paths);
        console.log('Paths obtenidos servicio:', paths);
      }),
      catchError(error => {
        console.error('Error al obtener paths:', error);
        return throwError(() => new Error(error));
      })
    );
  }
}
