import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService, Project } from '../../services/supabaseServices/project.service';
import { AuthService } from '../../services/supabaseServices/auth.service';
import { NotificationService } from '../../services/supabaseServices/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationModalComponent } from '../shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  projects: Project[] = [];
  loading = true;
  error: string | null = null;
  newProjectName = '';
  showNewProjectForm = false;
  showDeleteModal = false;
  projectToDelete: string | null = null;

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  async loadProjects() {
    try {
      this.loading = true;
      this.projects = await this.projectService.getProjects().toPromise() || [];
      this.error = null;
    } catch (err) {
      this.error = 'Error loading projects. Please try again.';
      console.error('Error loading projects:', err);
    } finally {
      this.loading = false;
    }
  }

  async createProject() {
    if (!this.newProjectName.trim()) {
      this.notificationService.createNotification({
        project_id: '',
        message: 'Please enter a project name',
        type: 'error'
      });
      return;
    }

    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newProject: Project = {
        name: this.newProjectName.trim(),
        user_id: user.id
      };

      const project = await this.projectService.createProject(newProject).toPromise();
      if (project) {
        this.projects.unshift(project);
        this.newProjectName = '';
        this.showNewProjectForm = false;
        this.notificationService.createNotification({
          project_id: project.id!,
          message: 'Project created successfully',
          type: 'success'
        });
      }
    } catch (err) {
      this.error = 'Error creating project. Please try again.';
      console.error('Error creating project:', err);
      this.notificationService.createNotification({
        project_id: '',
        message: 'Error creating project',
        type: 'error'
      });
    }
  }

  openDeleteModal(projectId: string) {
    this.projectToDelete = projectId;
    this.showDeleteModal = true;
  }

  async deleteProject() {
    if (!this.projectToDelete) return;

    try {
      await this.projectService.deleteProject(this.projectToDelete).toPromise();
      this.projects = this.projects.filter(p => p.id !== this.projectToDelete);
      this.notificationService.createNotification({
        project_id: '',
        message: 'Project deleted successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting project:', err);
      this.notificationService.createNotification({
        project_id: '',
        message: 'Error deleting project',
        type: 'error'
      });
    } finally {
      this.showDeleteModal = false;
      this.projectToDelete = null;
    }
  }

  onDeleteCancel() {
    this.showDeleteModal = false;
    this.projectToDelete = null;
  }

  openProject(projectId: string) {
    this.router.navigate(['/project', projectId]);
  }

  async signOut() {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Error signing out:', err);
      this.notificationService.createNotification({
        project_id: '',
        message: 'Error signing out',
        type: 'error'
      });
    }
  }
} 