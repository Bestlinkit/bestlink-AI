import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SandboxFile } from '@/store/useAppStore';

export const exportProjectAsZip = async (projectName: string, files: SandboxFile[]) => {
  const zip = new JSZip();

  // Add files to zip
  files.forEach(file => {
    // Basic path handling (could be extended for folders)
    zip.file(file.name, file.content);
  });

  // Generate zip file
  const content = await zip.generateAsync({ type: 'blob' });
  
  // Save file
  saveAs(content, `${projectName.toLowerCase().replace(/\s+/g, '-')}-bestlink-export.zip`);
};
