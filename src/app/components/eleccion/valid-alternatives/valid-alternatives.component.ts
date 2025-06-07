import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PathModalComponent } from '../../path-modal/path-modal.component';
import { ComparisonMode } from '../../../models/interfaces';
import { ComparisonModeService } from '../../../services/supabaseServices/comparison-mode.service';
import { from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ValidAlternativesService, PathValues } from '../../../services/valid-alternatives.service';

@Component({
  selector: 'app-valid-alternatives',
  standalone: true,
  imports: [CommonModule, PathModalComponent],
  templateUrl: './valid-alternatives.component.html',
  styleUrls: ['./valid-alternatives.component.css']
})
export class ValidAlternativesComponent implements OnInit {
  paths: PathValues[] = [];
  projectId: string = '';
  selectedPath: PathValues | null = null;
  isModalOpen = false;
  isLoading = true;
  error: string | null = null;
  Object = Object;
  comparisonModes: ComparisonMode[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comparisonModeService: ComparisonModeService,
    private validAlternativesService: ValidAlternativesService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['projectId']) {
        this.projectId = params['projectId'];
        this.paths = this.validAlternativesService.getValidAlternatives();

        if (this.paths.length === 0) {
          this.error = 'No se encontraron alternativas válidas';
        }

        this.isLoading = false;
        this.loadComparisonModes();
        this.sortPathsByTotalScore();
      } else {
        this.error = 'No se encontró el ID del proyecto';
        this.isLoading = false;
      }
    });
  }

  loadComparisonModes(): void {
    if (!this.projectId) {
      this.error = 'No se encontró el ID del proyecto';
      this.isLoading = false;
      return;
    }

    from(this.comparisonModeService.getComparisonModesByProject(this.projectId))
      .pipe(
        map((modes: ComparisonMode[]) => {
          // Ordenar por order_num como en el componente principal
          return modes.sort((a, b) => Number(a.order_num) - Number(b.order_num));
        }),
        catchError(err => {
          this.error = `Error al cargar modos de comparación: ${err.message || JSON.stringify(err)}`;
          this.isLoading = false;
          return of([]);
        })
      )
      .subscribe({
        next: (modes) => {
          this.comparisonModes = modes;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = `Error al cargar datos: ${error.message || JSON.stringify(error)}`;
          this.isLoading = false;
        }
      });
  }

  openPathModal(path: PathValues): void {
    this.selectedPath = path;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedPath = null;
  }

  goBack(): void {
    this.validAlternativesService.clearValidAlternatives();
    this.router.navigate(['/project/' + this.projectId + '/eleccion'], {
    });
  }

  getTotalScore(path: PathValues): number {
    if (!path.areaScores) return 0;
    return Object.values(path.areaScores).reduce((sum, score) => sum + score, 0);
  }

  getPathAreaScore(path: PathValues, areaId: string): number {
    return path.areaScores?.[areaId] || 0;
  }

  trackByFn(index: number, item: any): string {
    return item.id || index;
  }

  sortPathsByTotalScore(): void {
    this.paths.sort((a, b) => this.getTotalScore(b) - this.getTotalScore(a));
  }
}
