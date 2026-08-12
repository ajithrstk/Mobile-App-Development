import type { FileCategory } from '../types/message';

const byteUnits = ['B', 'KB', 'MB', 'GB'];

export function formatBytes(size?: number): string {
  if (!size || size <= 0) {
    return 'Unknown size';
  }

  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < byteUnits.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted = value >= 10 || unitIndex === 0 ? Math.round(value).toString() : value.toFixed(1);
  return `${formatted} ${byteUnits[unitIndex]}`;
}

export function getFileExtension(name?: string, mimeType?: string): string {
  const fileNameExtension = name?.split('.').pop()?.toLowerCase();

  if (fileNameExtension && fileNameExtension !== name?.toLowerCase()) {
    return fileNameExtension;
  }

  if (mimeType?.includes('pdf')) {
    return 'pdf';
  }

  if (mimeType?.includes('zip')) {
    return 'zip';
  }

  if (mimeType?.includes('presentation')) {
    return 'pptx';
  }

  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
    return 'xlsx';
  }

  if (mimeType?.includes('word')) {
    return 'docx';
  }

  if (mimeType?.startsWith('audio/')) {
    return 'mp3';
  }

  if (mimeType?.startsWith('text/')) {
    return 'txt';
  }

  return '';
}

export function getFileCategory(name?: string, mimeType?: string): FileCategory {
  const extension = getFileExtension(name, mimeType);

  if (extension === 'pdf') {
    return 'pdf';
  }

  if (['doc', 'docx'].includes(extension)) {
    return 'doc';
  }

  if (['xls', 'xlsx'].includes(extension)) {
    return 'sheet';
  }

  if (['ppt', 'pptx'].includes(extension)) {
    return 'presentation';
  }

  if (extension === 'zip') {
    return 'zip';
  }

  if (extension === 'txt') {
    return 'txt';
  }

  if (mimeType?.startsWith('audio/') || ['mp3', 'm4a', 'wav', 'aac', 'ogg'].includes(extension)) {
    return 'audio';
  }

  return 'generic';
}
