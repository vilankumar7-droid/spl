import { Pipe, PipeTransform } from '@angular/core';
import { EMPLOYMENT_LABELS, PURPOSE_META, STATUS_META } from '../../core/labels';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

@Pipe({ name: 'inr', standalone: true })
export class InrPipe implements PipeTransform {
  transform(v: number | null | undefined, precise = false): string {
    return v == null ? '—' : (precise ? inr2 : inr).format(v);
  }
}

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(v: string | null | undefined): string {
    return v ? (STATUS_META as Record<string, { label: string }>)[v]?.label ?? v : '—';
  }
}

@Pipe({ name: 'purpose', standalone: true })
export class PurposePipe implements PipeTransform {
  transform(v: string | null | undefined): string {
    return v ? (PURPOSE_META as Record<string, { label: string }>)[v]?.label ?? v : '—';
  }
}

@Pipe({ name: 'employment', standalone: true })
export class EmploymentPipe implements PipeTransform {
  transform(v: string | null | undefined): string {
    return v ? (EMPLOYMENT_LABELS as Record<string, string>)[v] ?? v : '—';
  }
}

@Pipe({ name: 'ago', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(v: string | null | undefined): string {
    if (!v) return '—';
    const s = Math.round((Date.now() - new Date(v).getTime()) / 1000);
    if (s < 45) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    if (s < 604800) return `${Math.round(s / 86400)} d ago`;
    return new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

@Pipe({ name: 'fileSize', standalone: true })
export class FileSizePipe implements PipeTransform {
  transform(v: number): string {
    return v < 1024 ? `${v} B` : v < 1048576 ? `${(v / 1024).toFixed(1)} KB` : `${(v / 1048576).toFixed(1)} MB`;
  }
}

export const FORMAT_PIPES = [InrPipe, StatusLabelPipe, PurposePipe, EmploymentPipe, TimeAgoPipe, FileSizePipe] as const;
