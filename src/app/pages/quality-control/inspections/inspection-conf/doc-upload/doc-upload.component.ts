import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { sMsg } from "src/app/core/models/shared/success-response.model";
import { InspectionService } from "src/app/core/services/app-services/operations/inspection.service";
import { SuccessMessage } from "src/app/core/services/shared/success-message.service";

import axios from "axios";

@Component({
  selector: "app-doc-upload",
  templateUrl: "./doc-upload.component.html",
  styleUrls: ["./doc-upload.component.scss"],
})
export class DocUploadComponent {
  @Input() id: string = "";
  @Output() closePopup = new EventEmitter<any>();
  @Output() closePopupAndReload = new EventEmitter<any>();

  @ViewChild("fileInput", { static: true }) fileInput: ElementRef;
  @Output() imageFile: EventEmitter<any> = new EventEmitter<any>();

  isImage: boolean = false;
  selectedImage: string | ArrayBuffer | null = null;
  finalFile: File | null = null;

  // Azure SAS Token & URL
  sasToken =
    "sp=racwdli&st=2025-08-03T21:07:08Z&se=2025-12-16T05:22:08Z&sv=2024-11-04&sr=c&sig=kOJjd7d%2FHg0LtRp9IEVkMkXAnlXrLCqPUrG4wrvH%2F1I%3D";
  sasUrl = "https://synerisblobstorage.blob.core.windows.net/servicedocs/";

  constructor(
    private inspectionService: InspectionService,
    private successMessage: SuccessMessage
  ) {}

  // Drag & drop file
  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.handleSelectedFile(file);
  }

  // Open file selector
  openFileInput() {
    this.fileInput.nativeElement.click();
  }

  // File selected from input
  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) this.handleSelectedFile(file);
  }

  // Prevent default drag behavior
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  // Handle file selection
  private handleSelectedFile(file: File) {
    this.finalFile = file;

    if (file.type.startsWith("image/")) {
      this.isImage = true;
      this.previewImage(file);
    } else {
      this.isImage = false;
      this.selectedImage = null;
    }
  }

  // Preview image
  private previewImage(file: File) {
    const reader = new FileReader();
    reader.onload = (event) => {
      this.selectedImage = event.target?.result;
    };
    reader.readAsDataURL(file);
  }

  isUploading: boolean = false;

  // Upload to Azure
  async uploadDocument() {
    if (!this.finalFile) {
      console.error("No file selected.");
      return;
    }

    this.isUploading = true;
    const blobUrl = `${this.sasUrl}${this.finalFile.name}?${this.sasToken}`;

    try {
      // Upload raw binary file to Azure Blob Storage
      const response = await axios.put(blobUrl, this.finalFile, {
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": this.finalFile.type || "application/octet-stream",
        },
      });

      if (response.status === 201) {
        console.log("Upload success!");

        const body = {
          refId: this.id,
          name: this.finalFile.name,
          fullPath: "",
          path: "",
          docId: "",
          url: response.config.url,
        };

        this.inspectionService.uploadDocuments(body).subscribe({
          next: (res: sMsg) => {
            this.isUploading = false;
            this.successMessage.show(res.message);
            this.closePopupAndReload.emit();
          },
          error: (err) => {
            console.error(err);
            this.isUploading = false;
          },
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      this.isUploading = false;
    }
  }
}
