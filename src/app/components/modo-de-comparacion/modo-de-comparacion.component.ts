import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ComparisonMode } from '../../models/comparacion';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ComparacionModeService } from '../../services/_Comparacion/comparacion-mode.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modo-de-comparacion',
  standalone: true,
  imports: [ ReactiveFormsModule, CommonModule, FormsModule ],
  providers: [ ComparacionModeService ],
  templateUrl: './modo-de-comparacion.component.html',
  styleUrl: './modo-de-comparacion.component.css'
})
export class ModoDeComparacionComponent implements OnInit, OnDestroy {
  comparisonModes: ComparisonMode[] = [];
  comparisonForm: FormGroup;
  isEditing = false;
  currentEditId: string | null = null;
  private subscriptions: Subscription = new Subscription();
  emojiOptions = [
    { value: '😀', label: 'Sonrisa' },
    { value: '😢', label: 'Triste' },
    { value: '🔥', label: 'Fuego' },
    { value: '🚀', label: 'Cohete' },
    { value: '🌟', label: 'Estrella' },
  ];

  constructor(
    private fb: FormBuilder,
    private comparacionDbService: ComparacionModeService
  ) {
    this.comparisonForm = this.fb.group({
      order: ['', [Validators.required, Validators.min(1)]],
      peso: ['', [Validators.required]],
      comparisonArea: ['', [Validators.required]],
      label: ['', [Validators.required]],
      symbol: ['',[Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadComparisonModes();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadComparisonModes(): void {
    const subscription = this.comparacionDbService.getItems().subscribe({
      next: (modes) => {
        this.comparisonModes = modes.sort((a, b) => a.order - b.order);
      },
      error: (error) => {
        console.error('Error loading comparison modes:', error);
      }
    });
    this.subscriptions.add(subscription);
  }

  updateEmoji(mode: ComparisonMode): void {
    const subscription = this.comparacionDbService
      .updateItem(Number(mode.id), { emoji: mode.symbol }) // Actualiza solo el emoji
      .subscribe({
        next: () => {
          console.log(`Emoji actualizado para el modo: ${mode.id}`);
        },
        error: (error) => {
          console.error('Error updating emoji:', error);
        },
      });
    this.subscriptions.add(subscription);
  }

  onSubmit(): void {
    if (this.comparisonForm.valid) {
      if (this.isEditing && this.currentEditId) {
        const subscription = this.comparacionDbService
          .updateItem(Number(this.currentEditId), this.comparisonForm.value)
          .subscribe({
            next: () => {
              this.loadComparisonModes();
              this.resetForm();
            },
            error: (error) => {
              console.error('Error updating comparison mode:', error);
            }
          });
        this.subscriptions.add(subscription);
      } else {
        const subscription = this.comparacionDbService
          .createItem(this.comparisonForm.value)
          .subscribe({
            next: () => {
              this.loadComparisonModes();
              this.resetForm();
            },
            error: (error) => {
              console.error('Error creating comparison mode:', error);
            }
          });
        this.subscriptions.add(subscription);
      }
    }
  }

  editMode(mode: ComparisonMode): void {
    this.isEditing = true;
    this.currentEditId = mode.id;
    this.comparisonForm.patchValue({
      order: mode.order,
      peso: mode.peso,
      comparisonArea: mode.comparisonArea,
      label: mode.label,
      emoji: mode.symbol,
    });
  }

  deleteMode(id: string): void {
    if (confirm('¿Está seguro de eliminar este modo de comparación?')) {
      const subscription = this.comparacionDbService
        .deleteItem(Number(id))
        .subscribe({
          next: () => {
            this.loadComparisonModes();
          },
          error: (error) => {
            console.error('Error deleting comparison mode:', error);
          }
        });
      this.subscriptions.add(subscription);
    }
  }

  resetForm(): void {
    this.comparisonForm.reset();
    this.isEditing = false;
    this.currentEditId = null;
  }
}
