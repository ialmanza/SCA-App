import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ComparisonMode } from '../../models/comparacion';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ComparisonModeService } from '../../services/supabaseServices/comparison-mode.service';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/_Notification/notification.service';
import { NotificationsComponent } from "../notifications/notifications.component";

@Component({
  selector: 'app-modo-de-comparacion',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, NotificationsComponent],
  providers: [ ComparisonModeService ],
  templateUrl: './modo-de-comparacion.component.html',
  styleUrl: './modo-de-comparacion.component.css'
})
export class ModoDeComparacionComponent implements OnInit, OnDestroy {
  comparisonModes: ComparisonMode[] = [];
  comparisonForm: FormGroup;
  isEditing = false;
  modoedicion = false;
  currentEditId: string | null = null;
  private subscriptions: Subscription = new Subscription();
  @Input() projectId!: string;
  emojiOptions = [
    { value: '😀', label: 'Sonrisa' },
    { value: '😢', label: 'Triste' },
    { value: '🔥', label: 'Fuego' },
    { value: '🚀', label: 'Cohete' },
    { value: '🌟', label: 'Estrella' },
  ];

  constructor(
    private fb: FormBuilder,
    private comparisonModeService: ComparisonModeService,
    private notificationservice: NotificationService
  ) {
    this.comparisonForm = this.fb.group({
      order_num: ['', [Validators.required, Validators.min(1)]],
      comparison_area: ['', [Validators.required]],
      label: ['', [Validators.required]],
      symbol: ['',[Validators.required]],
      peso: [1, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (this.projectId) {
      this.loadComparisonModes();
    } else {
      this.notificationservice.show('Error: No se ha especificado un proyecto', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadComparisonModes(): void {
    const subscription = this.comparisonModeService.comparisonModes$.subscribe({
      next: (modes) => {
        this.comparisonModes = modes;
      },
      error: (error) => {
        this.notificationservice.show('Error al cargar los modos de comparación', 'error');
      }
    });
    this.subscriptions.add(subscription);
    this.comparisonModeService.loadComparisonModes(this.projectId);
  }

  onSubmit(): void {
    if (this.comparisonForm.valid) {
      const formData = {
        ...this.comparisonForm.value,
        project_id: this.projectId
      };

      if (this.isEditing && this.currentEditId) {
        this.comparisonModeService.updateComparisonMode(this.currentEditId, formData)
          .then(() => {
            this.loadComparisonModes();
            this.resetForm();
            this.notificationservice.show('Modo de comparación actualizado exitosamente', 'success');
          })
          .catch((error) => {
            this.notificationservice.show('Error al actualizar el modo de comparación', 'error');
          });
      } else {
        this.comparisonModeService.createComparisonMode(formData)
          .then(() => {
            this.loadComparisonModes();
            this.resetForm();
            this.notificationservice.show('Modo de comparación creado exitosamente', 'success');
          })
          .catch((error) => {
            this.notificationservice.show('Error al crear el modo de comparación', 'error');
          });
      }
    }
  }

  editMode(mode: ComparisonMode): void {
    this.isEditing = true;
    this.currentEditId = mode.id;
    this.comparisonForm.patchValue({
      order_num: mode.order_num,
      comparison_area: mode.comparison_area,
      label: mode.label,
      symbol: mode.symbol,
      peso: mode.peso
    });
  }

  deleteMode(id: string): void {
    if (confirm('¿Está seguro de eliminar este modo de comparación?')) {
      this.comparisonModeService.deleteComparisonMode(id)
        .then(() => {
          this.loadComparisonModes();
          this.notificationservice.show('Modo de comparación eliminado exitosamente', 'success');
        })
        .catch((error) => {
          this.notificationservice.show('Error al eliminar el modo de comparación', 'error');
        });
    }
  }

  resetForm(): void {
    this.comparisonForm.reset({
      peso: 1
    });
    this.isEditing = false;
    this.currentEditId = null;
  }
}
