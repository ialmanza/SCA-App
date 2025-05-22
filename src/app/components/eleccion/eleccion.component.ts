import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, forkJoin, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Decision } from '../../models/decision';
import { Opcion, ComparisonMode } from '../../models/interfaces';
import { ComparisonModeService } from '../../services/supabaseServices/comparison-mode.service';
import { ComparisonCellService } from '../../services/supabaseServices/comparison-cell.service';
import { DecisionsService } from '../../services/supabaseServices/decisions.service';
import { OpcionesService } from '../../services/supabaseServices/opciones.service';
import { PathAreaScore, PathAreaScoreService } from '../../services/supabaseServices/path-area-score.service';
import { SelectedPath, SelectedPathsService } from '../../services/supabaseServices/selected-paths.service';
import { PathDescriptionsService } from '../../services/supabaseServices/path-descriptions.service';


interface AlternativaDisplay {
  hexaId: string;
  pathOptions: string[];
  areaScores: PathAreaScore[];
  pathDescription: {
    id: string;
    hex_code: string;
    path_descriptions: string[];
  };
  isValid: boolean;
  invalidAreas: string[];
}

interface AreaInfo {
  decision: Decision;
  opciones: Opcion[];
}

@Component({
  selector: 'app-eleccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eleccion.component.html',
  styleUrls: ['./eleccion.component.css'],
})
export class EleccionComponent implements OnInit {
  @Input() projectId!: string;

  alternativas: AlternativaDisplay[] = [];
  importantAreas: AreaInfo[] = [];
  loading = true;
  error = '';

  constructor(
    private pathAreaScoreService: PathAreaScoreService,
    private opcionesService: OpcionesService,
    private comparisonModeService: ComparisonModeService,
    private comparisonCellService: ComparisonCellService,
    private decisionsService: DecisionsService,
    private pathDescriptionsService: PathDescriptionsService
  ) {}

  ngOnInit() {
    if (!this.projectId) {
      this.error = 'No se proporcionó un ID de proyecto';
      this.loading = false;
      return;
    }

    this.loadData();
  }

  private async loadData() {
    try {
      this.loading = true;
      this.error = '';

      // 1. Cargar áreas importantes (ordenadas para mantener consistencia)
      const importantDecisions = await this.decisionsService.getImportantStatus(this.projectId).toPromise();
      if (!importantDecisions || importantDecisions.length === 0) {
        this.error = 'No hay áreas de decisión marcadas como importantes';
        this.loading = false;
        return;
      }

      // Ordenar las áreas importantes por algún criterio consistente (por ejemplo, por rotulo)
      importantDecisions.sort((a, b) => a.rotulo.localeCompare(b.rotulo));

      // 2. Cargar opciones para cada área importante
      this.importantAreas = await Promise.all(
        importantDecisions.map(async (decision) => {
          const opciones = await this.opcionesService.getOpcionesByArea(decision.id);
          return {
            decision,
            opciones
          };
        })
      );

      // 3. Obtener path descriptions del proyecto
      const pathDescriptions = await this.pathDescriptionsService.getPathDescriptionsForElection(this.projectId);
      if (!pathDescriptions || pathDescriptions.length === 0) {
        this.error = 'No hay caminos definidos en este proyecto';
        this.loading = false;
        return;
      }

      // 4. Obtener puntuaciones de áreas para cada camino
      const pathScores = await this.pathAreaScoreService.getProjectPathAreaScores(this.projectId);

      // 5. Obtener información de validez de opciones basada en puntuaciones mínimas
      let validOptionsMap: Map<string, Set<string>> | undefined;
      try {
        validOptionsMap = await this.comparisonCellService.getCellsWithMinimumScores(this.projectId).toPromise();
      } catch (error) {
        console.warn('No se pudieron cargar las validaciones mínimas:', error);
        validOptionsMap = undefined;
      }

      // 6. Obtener modos de comparación para verificar puntuaciones mínimas
      let comparisonModes: ComparisonMode[] = [];
      try {
        comparisonModes = await this.comparisonModeService.getComparisonModesByProject(this.projectId);
      } catch (error) {
        console.warn('No se pudieron cargar los modos de comparación:', error);
      }

      // 7. Crear alternativas display
      this.alternativas = await Promise.all(
        pathDescriptions.map(async (pathDescription) => {
          // Obtener scores para este camino específico
          const pathSpecificScores = pathScores.filter(score =>
            score.path_id === pathDescription.id
          );

          // Verificar validez del camino
          const { isValid, invalidAreas } = await this.checkPathValidity(
            pathDescription,
            validOptionsMap,
            comparisonModes
          );

          return {
            hexaId: pathDescription.hex_code,
            pathOptions: pathDescription.path_descriptions,
            areaScores: pathSpecificScores,
            pathDescription: pathDescription,
            isValid,
            invalidAreas
          };
        })
      );

      this.loading = false;

    } catch (error) {
      console.error('Error loading data:', error);
      this.error = 'Error al cargar los datos: ' + (error as Error).message;
      this.loading = false;
    }
  }

  private async checkPathValidity(
    pathDescription: {
      id: string;
      hex_code: string;
      path_descriptions: string[];
    },
    validOptionsMap: Map<string, Set<string>> | undefined,
    comparisonModes: ComparisonMode[]
  ): Promise<{ isValid: boolean; invalidAreas: string[] }> {
    if (!validOptionsMap || validOptionsMap.size === 0 || comparisonModes.length === 0) {
      return { isValid: true, invalidAreas: [] };
    }

    const invalidAreas: string[] = [];

    try {
      // Para cada opción en el camino
      for (let i = 0; i < pathDescription.path_descriptions.length; i++) {
        const optionDescription = pathDescription.path_descriptions[i];

        // Buscar la opción en la base de datos por descripción
        const opciones = await this.opcionesService.getOpcionesByProject(this.projectId);
        const option = opciones.find(opt => opt.descripcion === optionDescription);

        if (!option) {
          console.warn(`Opción no encontrada: ${optionDescription}`);
          continue;
        }

        // Verificar si esta opción cumple con las puntuaciones mínimas
        for (const mode of comparisonModes) {
          if (mode.puntuacion_minima !== null && mode.puntuacion_minima !== undefined) {
            const validOptionsForMode = validOptionsMap.get(mode.id);
            if (validOptionsForMode && !validOptionsForMode.has(option.id)) {
              if (!invalidAreas.includes(mode.comparison_area)) {
                invalidAreas.push(mode.comparison_area);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking path validity:', error);
      return { isValid: false, invalidAreas: ['Error de validación'] };
    }

    return {
      isValid: invalidAreas.length === 0,
      invalidAreas
    };
  }

  getOptionForArea(alternativa: AlternativaDisplay, areaIndex: number): string {
    // Verificar que el índice del área sea válido
    if (areaIndex < 0 || areaIndex >= this.importantAreas.length) {
      return 'N/A';
    }

    // Verificar que el camino tenga suficientes opciones
    if (areaIndex >= alternativa.pathOptions.length) {
      return 'Sin opción';
    }

    // Retornar la opción correspondiente del camino según el índice del área
    const option = alternativa.pathOptions[areaIndex];
    return option || 'Sin opción';
  }

  isAreaValid(alternativa: AlternativaDisplay, areaId: string): boolean {
    // Buscar si el área tiene problemas de validación
    const areaInfo = this.importantAreas.find(area => area.decision.id === areaId);
    if (!areaInfo) return true;

    // Verificar si el área está en la lista de áreas inválidas
    return !alternativa.invalidAreas.some(invalidArea =>
      invalidArea.includes(areaInfo.decision.rotulo) ||
      invalidArea.includes(areaInfo.decision.nombre_area)
    );
  }

  getTotalScore(alternativa: AlternativaDisplay): number {
    if (!alternativa.areaScores || alternativa.areaScores.length === 0) {
      return 0;
    }
    return alternativa.areaScores.reduce((total, score) => {
      const scoreValue = typeof score.score === 'number' ? score.score : 0;
      return total + scoreValue;
    }, 0);
  }

  getValidAlternativesCount(): number {
    return this.alternativas.filter(alt => alt.isValid).length;
  }

  getInvalidAlternativesCount(): number {
    return this.alternativas.filter(alt => !alt.isValid).length;
  }
}
