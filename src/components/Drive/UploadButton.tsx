import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { fileService } from '../../services/fileService';

interface UploadButtonProps {
  folderId: string | null;
  onUploaded: () => void;
}

export function UploadButton({ folderId, onUploaded }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await fileService.uploadFile(file, folderId || undefined);
      onUploaded();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
      >
        <Upload className="w-4 h-4" />
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
