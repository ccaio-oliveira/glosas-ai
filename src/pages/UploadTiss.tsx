import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    DuplicateUploadError, listTissUploads, uploadTissFile,
    type DuplicateInfo, type TissUpload,
} from "../lib/tissUploads";
import { useRef, useState, type DragEvent } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useCan } from "../contexts/AuthContext";

const statusLabel: Record<TissUpload['status'], string> = {
    pending: 'Na fila',
    processing: 'Processando',
    processed: 'Processado',
    failed: 'Falhou',
};

const statusStyle: Record<TissUpload['status'], string> = {
    pending: 'bg-neutral-100 text-neutral-600',
    processing: 'bg-warning-50 text-warning-600',
    processed: 'bg-success-50 text-success-700',
    failed: 'bg-danger-50 text-danger-700',
};

function formatSize(bytes: number) {
    return bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(2)} KB`
        : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadTiss() {
    const queryClient = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);
    const can = useCan();
    
    const [dragging, setDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [duplicate, setDuplicate] = useState<{ info: DuplicateInfo; file: File } | null>(null);

    const { data: uploads } = useQuery({
        queryKey: ['tiss-uploads'],
        queryFn: listTissUploads,
        refetchInterval: (query) => query.state.data?.some((u) => u.status === 'pending' || u.status === 'processing') ? 2000 : false,
    });

    const uploadMutation = useMutation({
        mutationFn: ({ file, force }: { file: File; force?: boolean }) =>
            uploadTissFile(file, { force, onProgress: setProgress }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tiss-uploads'] });
            setProgress(0);
            setDuplicate(null);
        },
        onError: (err, variables) => {
            setProgress(0);

            // 409 não é falha de envio: é o arquivo já processado antes. Cai num
            // aviso com contexto, não na mensagem genérica.
            if (err instanceof DuplicateUploadError) {
                setDuplicate({ info: err.duplicate, file: variables.file });
                return;
            }

            setError('Não foi possível enviar o arquivo. Verifique se é um XML TISS válido (até 50 MB).');
        }
    });

    function handleFiles(files: FileList | null) {
        if (!can.operate) return;

        const file = files?.[0];

        if (!file) return;

        setError(null);
        setDuplicate(null);
        uploadMutation.mutate({ file });
    }

    function handleDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    }

    const uploading = uploadMutation.isPending;

    return (
        <AppLayout
            title="Upload de Guias TISS"
            subtitle="Importe arquivos XML TISS para análise automática"
            actions={<Link to="/claims" className="text-sm text-brand-600 hover:underline">Ver guias</Link>}
        >
            <div className="flex max-w-[800px] flex-col gap-4">
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => can.operate && !uploading && inputRef.current?.click()}
                    className={clsx(
                        'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-200',
                        dragging ? 'border-brand-500 bg-brand-50' : 'border-border bg-surface'
                    )}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".xml,text/xml,application/xml"
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                    />

                    {uploading ? (
                        <div>
                            <div className="mb-2.5 text-md font-semibold text-text-primary">Enviando arquivo...</div>

                            <div className="mx-auto h-1.5 w-60 overflow-hidden rounded-sm bg-neutral-200">
                                <div className="h-full rounded-sm bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
                            </div>

                            <div className="mt-2 text-sm text-text-muted">{progress}% completo</div>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-2 text-md font-semibold text-text-primary">
                                Arraste o arquivo XML ou clique para selecionar
                            </div>

                            <div className="mb-3.5 text-sm text-text-muted">Padrão TISS · XML até 50 MB</div>

                            <Button variant="secondary">{can.operate ? 'Selecionar arquivos' : 'Sem permissão para enviar'}</Button>
                        </div>
                    )}
                </div>

                {error && <p className="text-sm text-danger-600">{error}</p>}

                {duplicate && (
                    <Card style={{ borderColor: 'var(--color-warning-500)' }}>
                        <div className="flex flex-col gap-2">
                            <div className="text-sm font-semibold text-warning-600">
                                Este arquivo já foi processado
                            </div>

                            <div className="text-sm text-text-secondary">
                                <span className="font-mono">{duplicate.info.original_filename}</span> foi processado
                                em {new Date(duplicate.info.processed_at).toLocaleString('pt-BR')}, gerando{' '}
                                {duplicate.info.claims_count} guia(s) e {duplicate.info.denials_count} glosa(s).
                            </div>

                            <div className="text-xs text-text-muted">
                                Enviar de novo vai duplicar essas glosas e dobrar o valor no dashboard.
                                Só force se souber que as anteriores foram removidas.
                            </div>

                            <div className="mt-1 flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setDuplicate(null)}>
                                    Cancelar
                                </Button>

                                <Button
                                    size="sm"
                                    variant="danger"
                                    disabled={uploading}
                                    onClick={() => uploadMutation.mutate({ file: duplicate.file, force: true })}
                                >
                                    Enviar mesmo assim
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                <Card padding="0" header={<span className="font-semibold text-text-primary">Arquivos importados</span>}>
                    {!uploads?.length && <p className="p-5 text-text-muted">Nenhum arquivo importado ainda</p>}

                    {!!uploads?.length && (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-neutral-50">
                                    {['Arquivo', 'Tamanho', 'Guias', 'Glosas', 'Status'].map((h) => (
                                        <th key={h} className="border-b border-border px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted">{h}</th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {uploads.map((upload) => (
                                    <tr key={upload.id} className="border-b border-border last:border-b-0">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-accent-50 text-[11px] font-bold text-accent-600">
                                                    XML
                                                </div>

                                                <span className="font-mono text-sm font-medium">{upload.original_filename}</span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-sm text-text-muted">{formatSize(upload.size_bytes)}</td>
                                        <td className="px-4 py-3 text-sm">{upload.claims_count}</td>
                                        <td className="px-4 py-3">
                                            {upload.denials_count > 0 ? (
                                                <span className="rounded-md bg-danger-50 px-2.5 py-0.5 text-sm font-bold text-danger-600">
                                                    {upload.denials_count} glosas
                                                </span>
                                            ) : (
                                                <span className="text-sm text-text-muted">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={clsx('rounded-full px-2.5 py-1 text-[11px] font-semibold', statusStyle[upload.status])}>
                                                {statusLabel[upload.status]}
                                            </span>
                                            {upload.status === 'failed' && upload.error_message && (
                                                <div className="mt-1 max-w-[220px] text-[11px] text-danger-600">{upload.error_message}</div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            </div>
        </AppLayout>
    )
}