import { api } from "./api";

export interface TissUpload {
    id: number;
    original_filename: string;
    size_bytes: number;
    content_hash: string | null;
    status: 'pending' | 'processing' | 'processed' | 'failed';
    claims_count: number;
    denials_count: number;
    error_message: string | null;
    created_at: string;
}

export interface DuplicateInfo {
    id: number;
    original_filename: string;
    processed_at: string;
    claims_count: number;
    denials_count: number;
}

/** Erro tipado para o 409 — deixa a tela oferecer o reenvio forçado em vez de
 *  cair na mensagem genérica de falha. */
export class DuplicateUploadError extends Error {
    duplicate: DuplicateInfo;

    constructor(duplicate: DuplicateInfo) {
        super('Arquivo duplicado');
        this.name = 'DuplicateUploadError';
        this.duplicate = duplicate;
    }
}

export async function listTissUploads() {
    const res = await api.get<TissUpload[]>('/api/tiss-uploads');
    return res.data;
}

export async function uploadTissFile(
    file: File,
    options: { force?: boolean; onProgress?: (percent: number) => void } = {},
) {
    const formData = new FormData();
    formData.append('file', file);
    if (options.force) formData.append('force', '1');

    try {
        const res = await api.post<TissUpload>('/api/tiss-uploads', formData, {
            onUploadProgress: (event) => {
                if (event.total && options.onProgress) {
                    options.onProgress(Math.round((event.loaded * 100) / event.total));
                }
            }
        });

        return res.data;
    } catch (error) {
        const response = (error as { response?: { status?: number; data?: { duplicate?: DuplicateInfo } } }).response;

        if (response?.status === 409 && response.data?.duplicate) {
            throw new DuplicateUploadError(response.data.duplicate);
        }

        throw error;
    }
}