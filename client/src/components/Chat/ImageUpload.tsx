"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Image as ImageIcon, UploadCloud, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onUpload: (files: any[]) => void;
  attachments: any[];
  onRemove: (index: number) => void;
}

export default function ImageUpload({ onUpload, attachments, onRemove }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      onUpload(data.files);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'text/*': ['.txt', '.md', '.ts', '.tsx', '.js', '.jsx']
    }
  });

  return (
    <div className="w-full">
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-wrap gap-2 mb-4 p-2 bg-white/5 border border-white/10 rounded-xl"
          >
            {attachments.map((file, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative group w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-zinc-900"
              >
                {file.mimetype?.startsWith('image/') ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${file.path}`} 
                    alt={file.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-zinc-500" />
                  </div>
                )}
                <button
                  onClick={() => onRemove(index)}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        {...getRootProps()}
        className={cn(
          "relative group border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer overflow-hidden",
          isDragActive ? "border-blue-500 bg-blue-500/5" : "border-white/10 hover:border-white/20 hover:bg-white/5",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6 text-blue-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">
              {isDragActive ? "Drop files here" : "Click or drag files to upload"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Supports screenshots, reference images, and text files
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
