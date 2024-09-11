import {Component, Inject} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatDialogActions,
  MatDialogClose,
  MatDialogTitle,
  MatDialogContent,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import { Decision } from '../../../models/decision';

@Component({
  selector: 'app-eliminar-decision',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './eliminar-decision.component.html',
  styleUrl: './eliminar-decision.component.css'
})
export class EliminarDecisionComponent {

  constructor(public dialog: MatDialog) {}

  openDialog(enterAnimationDuration: string, exitAnimationDuration: string): void {
    this.dialog.open(DialogAnimationsExampleDialog, {
      width: '250px',
      enterAnimationDuration,
      exitAnimationDuration,
    });
  }
}

@Component({
  selector: 'dialog-animations-example-dialog',
  templateUrl: './eliminar-decision.html',
  standalone: true,
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent],
})
export class DialogAnimationsExampleDialog {
  constructor(public dialogRef: MatDialogRef<DialogAnimationsExampleDialog>, @Inject(MAT_DIALOG_DATA) public data: Decision) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }

}
