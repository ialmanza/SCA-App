// import { Injectable } from '@angular/core';

// interface CellState {
//   isEditing: boolean;
//   value: string;
// }

// interface TableData {
//   [opcionId: string]: { [modeId: string]: CellState };
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class DataTableService {
//   private tableData: TableData = {};

//   constructor() {
//     // Load data from local storage on initialization
//     const storedData = localStorage.getItem('comparisonTableData');
//     if (storedData) {
//       this.tableData = JSON.parse(storedData);
//     }
//   }

//   // Get all cell states
//   getCellStates(): TableData {
//     return this.tableData;
//   }

//   // Get cell state for a specific option and mode
//   getCellState(opcionId: string, modeId: string): CellState {
//     if (!this.tableData[opcionId]) {
//       this.tableData[opcionId] = {};
//     }

//     if (!this.tableData[opcionId][modeId]) {
//       this.tableData[opcionId][modeId] = { isEditing: false, value: 'NA' };
//     }

//     return this.tableData[opcionId][modeId];
//   }

//   // Update cell state (modifies existing data)
//   setCellState(opcionId: string, modeId: string, value: string): void {
//     this.tableData[opcionId][modeId] = { isEditing: false, value };
//     this.saveData();
//   }

//   // Save data to local storage
//   private saveData(): void {
//     localStorage.setItem('comparisonTableData', JSON.stringify(this.tableData));
//   }
// }


// data-table.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface CellState {
  isEditing: boolean;
  value: string;
}

interface TableData {
  [key: string]: string; // Cambiamos la estructura para solo almacenar valores no default
}

@Injectable({
  providedIn: 'root'
})
export class DataTableService {
  private readonly STORAGE_KEY = 'comparisonTableData';
  private tableData: TableData = {};
  private tableDataSubject = new BehaviorSubject<TableData>({});
  private readonly DEFAULT_VALUE = 'NA';

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        this.tableData = JSON.parse(storedData);
        this.tableDataSubject.next(this.tableData);
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      this.tableData = {};
      this.tableDataSubject.next(this.tableData);
    }
  }

  private getKey(opcionId: string, modeId: string): string {
    return `${opcionId}-${modeId}`;
  }

  getCellState(opcionId: string, modeId: string): CellState {
    const key = this.getKey(opcionId, modeId);
    return {
      isEditing: false,
      value: this.tableData[key] || this.DEFAULT_VALUE
    };
  }

  setCellState(opcionId: string, modeId: string, value: string, isEditing: boolean): void {
    const key = this.getKey(opcionId, modeId);

    if (value === this.DEFAULT_VALUE) {
      // Si el valor es el default, lo eliminamos del storage
      delete this.tableData[key];
    } else {
      // Solo guardamos valores diferentes al default
      this.tableData[key] = value;
    }

    this.saveToLocalStorage();
    this.tableDataSubject.next({ ...this.tableData });
  }

  private saveToLocalStorage(): void {
    try {
      if (Object.keys(this.tableData).length > 0) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tableData));
      } else {
        // Si no hay datos no-default, removemos la entrada del localStorage
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }

  getTableData(): Observable<TableData> {
    return this.tableDataSubject.asObservable();
  }

  // Método para depuración
  logStorageSize(): void {
    const data = JSON.stringify(this.tableData);
    console.log('Current storage size:', new Blob([data]).size, 'bytes');
    console.log('Current number of stored cells:', Object.keys(this.tableData).length);
  }
}
