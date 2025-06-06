import { ComparisonModeService, ComparisonMode } from './../../services/supabaseServices/comparison-mode.service';
import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of, from } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/supabaseServices/notification.service';

@Component({
  selector: 'app-puntuaciones-minimas',
  standalone: true,
  imports: [ReactiveFormsModule, MatInputModule, MatProgressSpinnerModule, CommonModule],
  templateUrl: './puntuaciones-minimas.component.html',
  styleUrl: './puntuaciones-minimas.component.css'
})
export class PuntuacionesMinimasComponent implements OnInit, OnChanges {
  @Input() projectId!: string;
  areasForm: FormGroup;
  loading = false;
  error = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private comparacionService: ComparisonModeService,
    private notificationService: NotificationService
  ) {
    this.areasForm = this.fb.group({
      areas: this.fb.array([])
    });
  }

  get areasFormArray() {
    return this.areasForm.get('areas') as FormArray;
  }

  ngOnInit(): void {
    // No cargamos datos aquí, esperamos a que el projectId esté disponible
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && changes['projectId'].currentValue) {
      this.loadAreas();
    }
  }

  private loadAreas(): void {
    if (!this.projectId) {
      this.error = 'No se ha proporcionado un ID de proyecto válido';
      return;
    }

    this.loading = true;
    this.error = '';
    this.areasFormArray.clear(); // Limpiamos el array antes de cargar nuevos datos

    from(this.comparacionService.getComparisonModesByProject(this.projectId)).pipe(
      catchError(error => {
        this.error = 'Error al cargar las áreas importantes';
        this.notificationService.createNotification({
          project_id: this.projectId,
          message: 'Error al cargar las áreas importantes',
          type: 'error'
        });
        return of([]);
      }),
      finalize(() => this.loading = false)
    ).subscribe((areas: ComparisonMode[]) => {
      areas.forEach((area: ComparisonMode) => {
        this.areasFormArray.push(this.fb.group({
          id: [area.id],
          rotulo: [area.label],
          area: [area.comparison_area],
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

    from(this.comparacionService.updatePuntuacionMinima(id, puntuacion)).pipe(
      catchError(error => {
        this.error = 'Error al actualizar la puntuación';
        this.notificationService.createNotification({
          project_id: this.projectId,
          message: 'Error al actualizar la puntuación',
          type: 'error'
        });
        return of(false);
      }),
      finalize(() => this.loading = false)
    ).subscribe((success: boolean) => {
      if (success) {
        this.successMessage = 'Puntuación actualizada correctamente';
        this.notificationService.createNotification({
          project_id: this.projectId,
          message: 'Puntuación actualizada correctamente',
          type: 'success'
        });
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }
}
