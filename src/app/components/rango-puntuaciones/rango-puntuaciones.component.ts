import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rango-puntuaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rango-puntuaciones-container">
      <div class="rango-inputs">
        <div class="input-group">
          <label for="minScore">Puntuación Mínima:</label>
          <input 
            type="number" 
            id="minScore" 
            [(ngModel)]="minScore" 
            min="0"
            placeholder="Mínimo"
          >
        </div>
        <div class="input-group">
          <label for="maxScore">Puntuación Máxima:</label>
          <input 
            type="number" 
            id="maxScore" 
            [(ngModel)]="maxScore" 
            min="0"
            placeholder="Máximo"
          >
        </div>
        <div class="button-group">
          <button 
            class="filter-button" 
            (click)="applyFilter()"
            [disabled]="!isValidRange()"
          >
            Filtrar
          </button>
          <button 
            class="clear-button" 
            (click)="clearFilter()"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rango-puntuaciones-container {
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .rango-inputs {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .button-group {
      display: flex;
      gap: 0.5rem;
      margin-left: 1rem;
    }

    label {
      font-weight: 500;
      color: #333;
    }

    input {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 150px;
    }

    input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .filter-button {
      background-color: #007bff;
      color: white;
    }

    .filter-button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .filter-button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

    .clear-button {
      background-color: #6c757d;
      color: white;
    }

    .clear-button:hover {
      background-color: #5a6268;
    }
  `]
})
export class RangoPuntuacionesComponent {
  @Output() rangeChange = new EventEmitter<{min: number | null, max: number | null}>();

  minScore: number | null = null;
  maxScore: number | null = null;

  isValidRange(): boolean {
    if (this.minScore === null && this.maxScore === null) return false;
    if (this.minScore !== null && this.maxScore !== null && this.minScore > this.maxScore) return false;
    return true;
  }

  applyFilter(): void {
    if (!this.isValidRange()) return;

    // Validar que el mínimo no sea mayor que el máximo
    if (this.minScore !== null && this.maxScore !== null && this.minScore > this.maxScore) {
      const temp = this.minScore;
      this.minScore = this.maxScore;
      this.maxScore = temp;
    }

    this.rangeChange.emit({
      min: this.minScore,
      max: this.maxScore
    });
  }

  clearFilter(): void {
    this.minScore = null;
    this.maxScore = null;
    this.rangeChange.emit({
      min: null,
      max: null
    });
  }
} 