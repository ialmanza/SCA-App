import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-path-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Detalles del Camino</h2>
          <button class="close-button" (click)="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="path-info">
            <p><strong>Código:</strong> {{ path?.hexa }}</p>
            <div class="path-steps">
              <h3>Camino Recorrido:</h3>
              <div class="path-flow">
                <div *ngFor="let step of path?.path; let i = index; let last = last" class="path-step-container">
                  <div class="path-step">
                    {{ i + 1 }}. {{ step }}
                  </div>
                  <div *ngIf="!last" class="path-arrow">→</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      min-width: 400px;
      max-width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
      margin: 0;
      color: #333;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      line-height: 1;
    }

    .close-button:hover {
      color: #333;
    }

    .path-info {
      color: #333;
    }

    .path-steps {
      margin-top: 20px;
    }

    .path-steps h3 {
      color: #444;
      margin-bottom: 15px;
    }

    .path-flow {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 5px;
      margin-top: 15px;
    }

    .path-step-container {
      display: flex;
      align-items: center;
    }

    .path-step {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      padding: 10px 15px;
      border-radius: 4px;
      flex-grow: 1;
    }

    .path-arrow {
      margin: 0 8px;
      color: #666;
      font-weight: bold;
      font-size: 18px;
    }
  `]
})
export class PathModalComponent {
  @Input() isOpen: boolean = false;
  @Input() path: { hexa: string; path: string[] } | null = null;
  @Output() closeEvent = new EventEmitter<void>();

  closeModal() {
    this.closeEvent.emit();
  }
}
