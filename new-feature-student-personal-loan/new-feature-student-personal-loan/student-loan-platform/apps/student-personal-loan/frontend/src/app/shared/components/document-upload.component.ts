import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { DOCUMENT_META } from '../../core/labels';
import { DocumentType, LoanDocument } from '../../core/models';
import { ApiService, problemOf } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { FileSizePipe, TimeAgoPipe } from '../pipes/format.pipes';
import { IconComponent } from './icon.component';

const MAX_BYTES = 5 * 1024 * 1024;

/** Drag-and-drop PDF upload slot for one document type, with client-side pre-checks. */
@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [IconComponent, FileSizePipe, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="slot" [class.has-doc]="doc()" [class.drag]="dragging()"
         (dragover)="onDragOver($event)" (dragleave)="dragging.set(false)" (drop)="onDrop($event)">
      <div class="head">
        <div class="ic" [class.ok]="doc()?.status === 'VALIDATED'"><app-icon [name]="doc() ? 'check' : 'file'" [size]="18" /></div>
        <div class="spacer">
          <div class="strong">{{ meta().label }} @if (meta().required) { <span class="req">Required</span> } @else { <span class="opt">Optional</span> }</div>
          <div class="muted small">{{ meta().help }}</div>
        </div>
      </div>

      @if (doc(); as d) {
        <div class="file">
          <app-icon name="file" [size]="16" />
          <div class="spacer">
            <div class="name">{{ d.originalFilename }}</div>
            <div class="muted small">{{ d.sizeBytes | fileSize }} · uploaded {{ d.uploadedAt | ago }}</div>
          </div>
          <span class="badge" [class.tone-success]="d.status === 'VALIDATED'" [class.tone-danger]="d.status === 'FAILED'" [class.tone-info]="d.status !== 'VALIDATED' && d.status !== 'FAILED'">{{ d.status === 'VALIDATED' ? 'Checked' : d.status }}</span>
          <button class="btn btn-ghost btn-sm" (click)="download(d)" title="Download"><app-icon name="download" [size]="15" /></button>
          @if (editable()) { <button class="btn btn-ghost btn-sm" (click)="remove(d)" title="Remove"><app-icon name="trash" [size]="15" /></button> }
        </div>
        @if (d.validationMessage) { <div class="muted small note">{{ d.validationMessage }}</div> }
      }

      @if (editable()) {
        <label class="drop">
          <input type="file" accept="application/pdf,.pdf" (change)="onPick($event)" hidden />
          @if (uploading()) { <span class="spinner dark"></span> Uploading… }
          @else { <app-icon name="upload" [size]="16" /> {{ doc() ? 'Replace file' : 'Drag a PDF here or click to browse' }} <span class="muted small">· max 5 MB</span> }
        </label>
      }
    </div>`,
  styles: [`
    .slot { border: 1px solid var(--ink-200); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #fff; transition: border-color .15s, background .15s; }
    .slot.drag { border-color: var(--brand-500); background: var(--brand-50); }
    .head { display: flex; gap: 12px; align-items: flex-start; }
    .ic { width: 38px; height: 38px; border-radius: 10px; background: var(--ink-100); color: var(--ink-500); display: grid; place-items: center; flex-shrink: 0; }
    .ic.ok { background: var(--success-bg); color: var(--success); }
    .req, .opt { font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 99px; margin-left: 6px; }
    .req { background: var(--warning-bg); color: var(--warning); } .opt { background: var(--ink-100); color: var(--ink-500); }
    .file { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--ink-50); border-radius: 10px; }
    .name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px; }
    .note { padding-left: 4px; }
    .drop { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border: 1.5px dashed var(--ink-300); border-radius: 10px; cursor: pointer; color: var(--brand-700); font-weight: 600; }
    .drop:hover { border-color: var(--brand-500); background: var(--brand-50); }`],
})
export class DocumentUploadComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly loanId = input.required<number>();
  readonly type = input.required<DocumentType>();
  readonly doc = input<LoanDocument | undefined>();
  readonly editable = input(true);
  readonly changed = output<void>();
  readonly uploading = signal(false);
  readonly dragging = signal(false);
  readonly meta = computed(() => DOCUMENT_META[this.type()]);

  onDragOver(e: DragEvent) { if (this.editable()) { e.preventDefault(); this.dragging.set(true); } }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    const f = e.dataTransfer?.files?.[0];
    if (f && this.editable()) this.upload(f);
  }
  onPick(e: Event) {
    const el = e.target as HTMLInputElement;
    const f = el.files?.[0];
    el.value = '';
    if (f) this.upload(f);
  }

  upload(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) { this.toast.error('Only PDF files are accepted', file.name); return; }
    if (file.size > MAX_BYTES) { this.toast.error('File is too large', 'The limit is 5 MB.'); return; }
    this.uploading.set(true);
    this.api.uploadDocument(this.loanId(), this.type(), file).subscribe({
      next: () => { this.uploading.set(false); this.toast.success(`${this.meta().label} uploaded`); this.changed.emit(); },
      error: err => { this.uploading.set(false); this.toast.error('Upload failed', problemOf(err).detail); },
    });
  }

  remove(d: LoanDocument) {
    this.api.deleteDocument(this.loanId(), d.id).subscribe({
      next: () => { this.toast.info(`${this.meta().label} removed`); this.changed.emit(); },
      error: err => this.toast.error('Could not remove file', problemOf(err).detail),
    });
  }

  download(d: LoanDocument) {
    this.api.downloadDocument(this.loanId(), d.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = d.originalFilename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: err => this.toast.error('Download failed', problemOf(err).detail),
    });
  }
}
