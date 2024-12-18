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
  private apiUrl = 'https://sca-omega.vercel.app/api/alternativas/'

  constructor(private http: HttpClient) { }

  getSelectedPaths(): Observable<PathSelection[]> {
    return this.selectedPathsSubject.asObservable();
  }

  addPath(hexCode: string, path: string[]) {
    const currentPaths = this.selectedPathsSubject.value;
    const newPath: PathSelection = { hexCode, path };

    const updatedPaths = [...currentPaths, newPath];
    this.selectedPathsSubject.next(updatedPaths);
    this.saveToLocalStorage(updatedPaths);
  }

  removePath(hexCode: string) {
    const currentPaths = this.selectedPathsSubject.value;
    const updatedPaths = currentPaths.filter(path => path.hexCode !== hexCode);
    this.selectedPathsSubject.next(updatedPaths);
    this.saveToLocalStorage(updatedPaths);
  }

  public saveToLocalStorage(paths: PathSelection[]) {
    localStorage.setItem('selectedPaths', JSON.stringify(paths));
  }

  public loadFromLocalStorage() {
    const stored = localStorage.getItem('selectedPaths');
    if (stored) {
      this.selectedPathsSubject.next(JSON.parse(stored));
    }
  }

  // treeCreateOptions(item: any): Observable<any> {
  //   const header = new HttpHeaders({
  //     'Content-Type': 'application/json'
  //   });
  //   return this.http.post('https://sca-omega.vercel.app/api/alternativa/create/', item, { headers: header });
  // }

  // public addPathToBackend(hexCode: string, path: string[]): Observable<any> {
  //   console.log("en el servicio se envia asi",hexCode, path);
  //   const newPath: PathSelection = { hexCode, path };

  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  //   return this.http.post('https://sca-omega.vercel.app/api/alternativa/create/', newPath, { headers });
  // }

  public addPathToBackend(hexCode: string, path: string[]): Observable<any> {
    const payload = {
      hexa: hexCode,
      options: path.map(p => parseInt(p)) // Convierte los paths a números enteros
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post('https://sca-omega.vercel.app/api/alternativa/create/', payload, { headers }).pipe(
      tap(response => {
        console.log('Respuesta del backend al crear alternativa:', response);
      }),
      catchError(error => {
        console.error('Error al crear alternativa:', error);
        return throwError(error);
      })
    );
  }

  public getPathsFromBackend(): Observable<PathSelection[]> {
    console.log("get en servicio",this.http.get<any[]>(this.apiUrl));
    return this.http.get<any[]>(this.apiUrl);
  }
}



// const payload = {
//   descripcion: item.descripcion,
//   cod_area: item.cod_area
// };
