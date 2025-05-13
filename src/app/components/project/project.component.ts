import { Component, OnInit } from '@angular/core';
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
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { DecisionesFormComponent } from '../area-de-decision/decisiones-form/decisiones-form.component';
import { OpcionComponent } from '../opciones-de-decision/opcion/opcion.component';
import { ModoDeComparacionComponent } from '../modo-de-comparacion/modo-de-comparacion.component';
import { VinculosComponent } from '../vinculos/vinculos.component';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DecisionesFormComponent,
    OpcionComponent,
    ModoDeComparacionComponent,
    VinculosComponent
  ],
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit {
  project: Project | null = null;
  loading = true;
  error: string | null = null;
  activeTab = 'overview';
  isEditing = false;
  editForm = {
    name: ''
  };

  // Statistics
  stats = {
    decisionAreas: 0,
    options: 0,
    comparisonModes: 0,
    importantAreas: 0
  };

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
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProject();
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

    // Load decision areas
    this.decisionAreaService.getDecisionAreasByProject(this.project.id)
      .then(areas => {
        this.stats.decisionAreas = areas.length;
        this.stats.importantAreas = areas.filter(area => area.is_important).length;
      });

    // Load options
    this.opcionesService.getOpcionesByProject(this.project.id)
      .then(options => {
        this.stats.options = options.length;
      });

    // Load comparison modes
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

  deleteProject() {
    if (!this.project?.id) return;

    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      this.projectService.deleteProject(this.project.id)
        .subscribe({
          next: () => {
            this.router.navigate(['/']);
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
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    // Navigate to the corresponding route if it exists
    switch (tab) {
      case 'decision-areas':
        this.router.navigate(['decisiones-form'], { relativeTo: this.route });
        break;
      case 'options':
        this.router.navigate(['opciones'], { relativeTo: this.route });
        break;
      case 'comparison':
        this.router.navigate(['modo-de-comparacion'], { relativeTo: this.route });
        break;
      case 'links':
        this.router.navigate(['vinculos'], { relativeTo: this.route });
        break;
      default:
        this.router.navigate(['.'], { relativeTo: this.route });
    }
  }
}
