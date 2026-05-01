import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';

/**
 * Drag-and-drop file upload area.
 * @param {{ onFileSelect: (file: File) => void, isLoading?: boolean, error?: string }} props
 */
export default function FileDropzone({ onFileSelect, isLoading = false, error }) {
  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        return;
      }
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    disabled: isLoading,
  });

  const selectedFile = acceptedFiles[0];

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl py-14 px-8 text-center cursor-pointer transition-all duration-300 group ${
          isDragActive
            ? 'border-accent bg-accent/5 scale-[1.01]'
            : error
            ? 'border-error/50 bg-error/5'
            : 'border-border hover:border-accent/40 hover:bg-accent/[0.03]'
        } ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-5">
          {isLoading ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
              <div>
                <p className="text-lg font-semibold text-text-primary">Processing your resume...</p>
                <p className="text-sm text-text-secondary mt-1.5">Extracting text from PDF</p>
              </div>
            </>
          ) : selectedFile ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-success" />
              </div>
              <div>
                <p className="text-lg font-semibold text-text-primary">{selectedFile.name}</p>
                <p className="text-sm text-text-secondary mt-1.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB — Ready to upload
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/15 transition-colors duration-300">
                <Upload className="w-8 h-8 text-accent group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-lg font-semibold text-text-primary">
                  {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                </p>
                <p className="text-sm text-text-secondary mt-1.5">
                  or click to browse — PDF only, max 10MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3 text-error text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
