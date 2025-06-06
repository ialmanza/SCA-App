import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService, Project } from '../../services/supabaseServices/project.service';
import { DecisionAreaService } from '../../services/supabaseServices/decision-area.service';
import { OpcionesService } from '../../services/supabaseServices/opciones.service';
import { ComparisonModeService } from '../../services/supabaseServices/comparison-mode.service';
import { ComparisonCellService } from '../../services/supabaseServices/comparison-cell.service';
import { VinculosService } from '../../services/supabaseServices/vinculos.service';
import { NotificationService } from '../../services/supabaseServices/notification.service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { DecisionesFormComponent } from '../area-de-decision/decisiones-form/decisiones-form.component';
import { OpcionComponent } from '../opciones-de-decision/opcion/opcion.component';
import { ModoDeComparacionComponent } from '../modo-de-comparacion/modo-de-comparacion.component';
import { VinculosComponent } from '../vinculos/vinculos.component';
import { GrafoComponent } from "../grafo/grafo.component";
import { TablaDeComparacionComponent } from "../tabla-de-comparacion/tabla-de-comparacion.component";
import { PosiblesAlternativasComponent } from '../posibles-alternativas/posibles-alternativas.component';
import { TablaDeSeleccionComponent } from '../tabla-de-seleccion/tabla-de-seleccion.component';
import { PuntuacionesMinimasComponent } from '../puntuaciones-minimas/puntuaciones-minimas.component';
import { DecisionCheckComponent } from '../area-de-decision/decision-check/decision-check.component';
import { ConfirmationModalComponent } from '../shared/confirmation-modal/confirmation-modal.component';
import { EleccionComponent } from "../eleccion/eleccion.component";
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DecisionesFormComponent,
    ModoDeComparacionComponent,
    VinculosComponent,
    GrafoComponent,
    TablaDeComparacionComponent,
    PosiblesAlternativasComponent,
    TablaDeSeleccionComponent,
    PuntuacionesMinimasComponent,
    DecisionCheckComponent,
    ConfirmationModalComponent,
    EleccionComponent,
    TranslateModule
  ],
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit, OnDestroy {
  project: Project | null = null;
  loading = true;
  error: string | null = null;
  activeTab = 'overview';
  isEditing = false;
  editForm = {
    name: ''
  };

  // Modal properties
  showModal = false;
  activeModal: 'puntuaciones' | 'decision-check' | 'grafo' | 'vinculos' | null = null;
  modalTitle = '';

  // Statistics
  stats = {
    decisionAreas: 0,
    options: 0,
    comparisonModes: 0,
    importantAreas: 0
  };

  showDeleteModal = false;
  currentLang = 'es';
  private destroy$ = new Subject<void>();

  constructor(
    private projectService: ProjectService,
    private decisionAreaService: DecisionAreaService,
    private opcionesService: OpcionesService,
    private comparisonModeService: ComparisonModeService,
    private comparisonCellService: ComparisonCellService,
    private vinculosService: VinculosService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private translationService: TranslationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadProject();
    this.setupLanguageSubscription();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupLanguageSubscription() {
    this.translationService.getCurrentLang()
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLang = lang;
        this.updateModalTitles();
      });
  }

  private updateModalTitles() {
    if (this.activeModal) {
      this.translate.get(`project.dashboard.quickActions.${this.activeModal}`)
        .subscribe(title => {
          this.modalTitle = title;
        });
    }
  }

  loadProject() {
    this.loading = true;
    this.error = null;

    this.route.params.pipe(
      switchMap(params => {
        const projectId = params['id'];
        if (!projectId) {
          throw new Error('Project ID is required');
        }
        return this.projectService.getProject(projectId);
      }),
      catchError(error => {
        this.error = 'Error loading project: ' + error.message;
        this.loading = false;
        return of(null);
      })
    ).subscribe(project => {
      if (project) {
        this.project = project;
        this.editForm.name = project.name;
        this.loadProjectStats();
      }
      this.loading = false;
    });
  }

  private loadProjectStats() {
    if (!this.project?.id) return;

    this.decisionAreaService.getDecisionAreasByProject(this.project.id)
      .then(areas => {
        this.stats.decisionAreas = areas.length;
        this.stats.importantAreas = areas.filter(area => area.is_important).length;
      });

    this.opcionesService.getOpcionesByProject(this.project.id)
      .then(options => {
        this.stats.options = options.length;
      });

    this.comparisonModeService.getComparisonModesByProject(this.project.id)
      .then(modes => {
        this.stats.comparisonModes = modes.length;
      });
  }

  startEditing() {
    this.isEditing = true;
  }

  cancelEditing() {
    this.isEditing = false;
    if (this.project) {
      this.editForm.name = this.project.name;
    }
  }

  saveProject() {
    if (!this.project?.id) return;

    this.projectService.updateProject(this.project.id, { name: this.editForm.name })
      .subscribe({
        next: (updatedProject) => {
          this.project = updatedProject;
          this.isEditing = false;
          this.notificationService.createNotification({
            project_id: this.project.id!,
            message: 'Project updated successfully',
            type: 'success'
          });
        },
        error: (error) => {
          this.error = 'Error updating project: ' + error.message;
          this.notificationService.createNotification({
            project_id: this.project!.id!,
            message: 'Error updating project',
            type: 'error'
          });
        }
      });
  }

  openDeleteModal() {
    this.showDeleteModal = true;
  }

  deleteProject() {
    if (!this.project?.id) return;

    this.projectService.deleteProject(this.project.id)
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
          this.notificationService.createNotification({
            project_id: this.project!.id!,
            message: 'Project deleted successfully',
            type: 'success'
          });
        },
        error: (error) => {
          this.error = 'Error deleting project: ' + error.message;
          this.notificationService.createNotification({
            project_id: this.project!.id!,
            message: 'Error deleting project',
            type: 'error'
          });
        }
      });
  }

  onDeleteCancel() {
    this.showDeleteModal = false;
  }

  navegarToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authService.signOut().then(() => {
      this.project = null;
      this.error = null;

      // Agregamos un pequeño retraso para asegurar que todo se ha limpiado
      setTimeout(() => {
        this.router.navigate(['/login'], { replaceUrl: true });

        // Mostramos notificación solo si tenemos un ID de proyecto válido
        if (this.project && this.project.id) {
          this.notificationService.createNotification({
            project_id: this.project.id,
            message: 'Logged out successfully',
            type: 'success'
          });
        } else {
          this.showGenericNotification('Logged out successfully', 'success');
        }
      }, 100);
    }).catch((error) => {
      this.error = 'Error logging out: ' + error.message;
      this.showGenericNotification('Error logging out', 'error');
    });
  }

  showGenericNotification(message: string, type: 'success' | 'error') {
    if (message && (type === 'success' || type === 'error')) {
      this.translate.get(message).subscribe(translatedMessage => {
        console.log(translatedMessage + ' ' + type);
        // If you have a notification service, you can use it here
        // this.notificationService.show(translatedMessage, type);
      });
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  navigateTo(path: string) {
    if (!this.project?.id) return;
    this.router.navigate(['/project', this.project.id, path]);
  }

  openModal(modalType: "puntuaciones" | "decision-check" | "grafo" | "vinculos") {
    this.activeModal = modalType;
    this.showModal = true;

    switch(modalType) {
      case 'vinculos':
        this.modalTitle = 'vinculos.title';
        break;
      case 'decision-check':
        this.modalTitle = 'project.dashboard.quickActions.selectImportantAreas';
        break;
      case 'grafo':
        this.modalTitle = 'project.dashboard.quickActions.graph';
        break;
      case 'puntuaciones':
        this.modalTitle = 'project.dashboard.quickActions.minScores';
        break;
    }
  }

  closeModal() {
    this.showModal = false;
    this.activeModal = null;
    this.modalTitle = '';
  }

  changeLanguage(lang: string) {
    this.translationService.setLanguage(lang);
    this.currentLang = lang;

    this.translate.get('project.notifications.languageChanged')
      .subscribe(message => {
        this.showGenericNotification(message, 'success');
      });
  }
}
