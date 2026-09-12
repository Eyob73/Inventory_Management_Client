import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-image-preview-dialog",
  standalone: true,
  imports: [MatDialogModule, MatIconModule, MatButtonModule],
  template: `
    <div class="image-preview-container">
      <button mat-icon-button class="close-btn" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
      <img [src]="data.imageUrl" [alt]="data.altText" />
    </div>
  `,
  styles: [`
    .image-preview-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
      width: 100%;
      height: 100%;
      outline: none;
    }
    img {
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 8px;
    }
    .close-btn {
      position: fixed;
      top: 16px;
      right: 16px;
      color: white;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10;
    }
    .close-btn:hover {
      background: rgba(0, 0, 0, 0.8);
    }
  `]
})
export class ImagePreviewDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { imageUrl: string; altText: string },
    private dialogRef: MatDialogRef<ImagePreviewDialogComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }
}
