import { api } from "./api";

export interface TissUpload {
    id: number;
    original_filename: string;
    size_bytes: number;
    status: 'pending' | 'processing' | 'processed' | 'failed';
    claims_count: number;
    denials_count: number;
    error_message: string | null;
    created_at: string;
}

export async function listTissUploads() {
    const res = await api.get<TissUpload[]>('/api/tiss-uploads');
    return res.data;
}

export async function uploadTissFile(file: File, onProgress?: (percent: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post<TissUpload>('/api/tiss-uploads', formData, {
        onUploadProgress: (event) => {
            if (event.total && onProgress) {
                onProgress(Math.round((event.loaded * 100) / event.total));
            }
        }
    });

    return res.data;
}