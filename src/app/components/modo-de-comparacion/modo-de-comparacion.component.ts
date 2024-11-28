import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ComparisonMode } from '../../models/comparacion';
import { ComparisonModeService } from '../../services/comparision-mode.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modo-de-comparacion',
  standalone: true,
  imports: [ ReactiveFormsModule, CommonModule ],
  templateUrl: './modo-de-comparacion.component.html',
  styleUrl: './modo-de-comparacion.component.css'
})
export class ModoDeComparacionComponent {
  comparisonModes: ComparisonMode[] = [];
  comparisonForm: FormGroup;
  isEditing = false;
  currentEditId: string | null = null;

  constructor(
    private comparisonModeService: ComparisonModeService,
    private fb: FormBuilder
  ) {
    this.comparisonForm = this.fb.group({
      order: ['', [Validators.required, Validators.min(1)]],
      comparisonArea: ['', [Validators.required]],
      label: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.comparisonModeService.getComparisonModes()
      .subscribe(modes => {
        this.comparisonModes = modes.sort((a, b) => a.order - b.order);
      });
  }

  onSubmit(): void {
    if (this.comparisonForm.valid) {
      if (this.isEditing && this.currentEditId) {
        this.comparisonModeService.updateComparisonMode({
          id: this.currentEditId,
          ...this.comparisonForm.value
        });
      } else {
        this.comparisonModeService.addComparisonMode(this.comparisonForm.value);
      }
      this.resetForm();
    }
  }

  editMode(mode: ComparisonMode): void {
    this.isEditing = true;
    this.currentEditId = mode.id;
    this.comparisonForm.patchValue({
      order: mode.order,
      comparisonArea: mode.comparisonArea,
      label: mode.label
    });
  }

  deleteMode(id: string): void {
    if (confirm('¿Está seguro de eliminar este modo de comparación?')) {
      this.comparisonModeService.deleteComparisonMode(id);
    }
  }

  resetForm(): void {
    this.comparisonForm.reset();
    this.isEditing = false;
    this.currentEditId = null;
  }
}
