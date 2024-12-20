import { ComparacionModeService } from './../../services/_Comparacion/comparacion-mode.service';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-puntuaciones-minimas',
  standalone: true,
  imports: [ ReactiveFormsModule, MatInputModule, MatProgressSpinnerModule, CommonModule ],
  templateUrl: './puntuaciones-minimas.component.html',
  styleUrl: './puntuaciones-minimas.component.css'
})
export class PuntuacionesMinimasComponent implements OnInit {
  areasForm: FormGroup;
  loading = false;
  error = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private comparacionService: ComparacionModeService
  ) {
    this.areasForm = this.fb.group({
      areas: this.fb.array([])
    });
  }

  get areasFormArray() {
    return this.areasForm.get('areas') as FormArray;
  }

  ngOnInit(): void {
    this.loadAreas();
  }

  private loadAreas(): void {
    this.loading = true;
    this.comparacionService.getItems().pipe(
      catchError(error => {
        this.error = 'Error al cargar las áreas importantes';
        console.error('Error:', error);
        return of([]);
      }),
      finalize(() => this.loading = false)
    ).subscribe(areas => {
      areas.forEach(area => {
        this.areasFormArray.push(this.fb.group({
          id: [area.id],
          rotulo: [area.rotulo],
          area:[area.comparisonArea],
          puntuacion: [area.puntuacion_minima || 0]
        }));
      });
    });
  }

  updatePuntuacion(index: number): void {
    const areaControl = this.areasFormArray.at(index);
    const id = areaControl.get('id')?.value;
    const puntuacion = areaControl.get('puntuacion')?.value;

    if (id === undefined || puntuacion === undefined) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    this.comparacionService.updatePuntuacionMinima(id, puntuacion).pipe(
      catchError(error => {
        this.error = 'Error al actualizar la puntuación';
        console.error('Error:', error);
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe(response => {
      if (response) {
        this.successMessage = 'Puntuación actualizada correctamente';
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }
}
