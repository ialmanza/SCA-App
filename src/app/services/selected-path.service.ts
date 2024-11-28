import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface PathSelection {
  hexCode: string;
  path: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SelectedPathsService {
  private selectedPathsSubject = new BehaviorSubject<PathSelection[]>([]);

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

  private saveToLocalStorage(paths: PathSelection[]) {
    localStorage.setItem('selectedPaths', JSON.stringify(paths));
  }

  private loadFromLocalStorage() {
    const stored = localStorage.getItem('selectedPaths');
    if (stored) {
      this.selectedPathsSubject.next(JSON.parse(stored));
    }
  }
}
