import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, CircleAlert, CircleX, Info, ShieldCheck } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';
import { formatBRL } from '../lib/denials';
import {
    categoryLabel, getPreventiveRules, validateGuide,
    type Finding, type ValidationResult,
} from '../lib/preventive';

const PLACEHOLDER = `Cole aqui o XML do lote de guias que você vai enviar ao convênio.

É o arquivo de ENVIO (prestador → operadora), não o demonstrativo de retorno.`;

const severityStyle = {
    error: { icon: CircleX, text: 'text-danger-700', bg: 'bg-danger-50', iconColor: 'text-danger-500' },
    warning: { icon: CircleAlert, text: 'text-warning-600', bg: 'bg-warning-50', iconColor: 'text-warning-500' },
} as const;

function FindingRow({ finding }: { finding: Finding }) {
    const style = severityStyle[finding.severity];
    const Icon = style.icon;

    return (
        <div className="flex items-start gap-2.5 border-b border-neutral-50 px-5 py-3 last:border-b-0">
            <Icon size={16} className={cn('mt-0.5 flex-shrink-0', style.iconColor)} />

            <div className="min-w-0 flex-1">
                <div className={cn('text-[13px] font-medium', style.text)}>{finding.message}</div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                    <span className={cn('rounded px-1.5 py-0.5 font-semibold', style.bg, style.text)}>
                        {categoryLabel[finding.category]}
                    </span>

                    {finding.claim_number && <span>guia {finding.claim_number}</span>}

                    <span className="font-mono">{finding.field}</span>

                    {finding.amount_at_risk > 0 && (
                        <span className="tabular-nums">{formatBRL(finding.amount_at_risk)} em jogo</span>
                    )}
                </div>
            </div>
        </div>
    );
}

function Summary({ result }: { result: ValidationResult }) {
    const clean = result.error_count === 0 && result.warning_count === 0;

    return (
        <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-3.5', clean ? 'bg-success-50' : 'bg-neutral-50')}>
            {clean ? (
                <span className="flex items-center gap-2 text-sm font-semibold text-success-700">
                    <CheckCircle2 size={16} /> Nenhum problema encontrado
                </span>
            ) : (
                <span className="text-sm font-semibold text-text-primary">
                    {result.error_count} erro(s) · {result.warning_count} alerta(s)
                </span>
            )}

            <span className="text-xs text-text-muted">
                {result.guide_count} guia(s) · {result.procedure_count} procedimento(s)
            </span>

            {result.amount_at_risk > 0 && (
                <span className="ml-auto text-xs text-text-secondary">
                    <strong className="tabular-nums text-text-primary">{formatBRL(result.amount_at_risk)}</strong> em jogo
                </span>
            )}
        </div>
    );
}

export default function Preventive() {
    const [xml, setXml] = useState('');

    const { data: rules } = useQuery({ queryKey: ['preventive-rules'], queryFn: getPreventiveRules });

    const validation = useMutation({
        mutationFn: () => validateGuide(xml),
    });

    const parseError = validation.error
        ? (validation.error as { response?: { data?: { message?: string } } }).response?.data?.message
            ?? 'Não foi possível analisar o arquivo.'
        : null;

    const result = validation.data;

    return (
        <AppLayout
            title="Faturamento Preventivo"
            subtitle="Analise a guia antes de enviar ao convênio"
        >
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_320px]">
                <div className="flex flex-col gap-4">
                    <Card
                        padding="0"
                        header={
                            <>
                                <span className="font-semibold text-text-primary">XML do lote de guias</span>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={!xml}
                                        onClick={() => { setXml(''); validation.reset(); }}
                                    >
                                        Limpar
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="accent"
                                        disabled={!xml.trim() || validation.isPending}
                                        onClick={() => validation.mutate()}
                                    >
                                        {validation.isPending ? 'Analisando...' : 'Analisar guia'}
                                    </Button>
                                </div>
                            </>
                        }
                    >
                        <textarea
                            value={xml}
                            onChange={(e) => setXml(e.target.value)}
                            placeholder={PLACEHOLDER}
                            spellCheck={false}
                            className="h-[300px] w-full resize-none bg-neutral-50 p-4 font-mono text-xs leading-relaxed text-text-primary outline-none"
                        />
                    </Card>

                    {parseError && (
                        <Card className="border-danger-500">
                            <div className="flex items-start gap-2.5">
                                <CircleX size={16} className="mt-0.5 flex-shrink-0 text-danger-500" />
                                <div>
                                    <div className="text-sm font-semibold text-danger-700">Não foi possível ler o arquivo</div>
                                    <div className="mt-0.5 text-sm text-text-secondary">{parseError}</div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {result && (
                        <Card padding="0" header={<span className="font-semibold text-text-primary">Resultado da análise</span>}>
                            <Summary result={result} />

                            {result.findings.map((finding, i) => (
                                <FindingRow key={`${finding.field}-${finding.claim_number}-${i}`} finding={finding} />
                            ))}

                            {!result.findings.length && (
                                <p className="px-5 py-4 text-sm text-text-secondary">
                                    As {result.guide_count} guia(s) passaram por todas as regras ativas. Isso não garante
                                    que o convênio vá pagar — só que os problemas que conseguimos detectar não estão lá.
                                </p>
                            )}
                        </Card>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <Card>
                        <div className="mb-3 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-brand-600" />
                            <span className="text-sm font-semibold text-text-primary">Regras ativas</span>
                        </div>

                        <ul className="flex flex-col gap-2">
                            {rules?.active.map((rule) => (
                                <li key={rule} className="flex items-start gap-2 text-[13px] text-text-secondary">
                                    <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-success-500" />
                                    {rule}
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card>
                        <div className="mb-2 flex items-center gap-2">
                            <Info size={16} className="text-text-muted" />
                            <span className="text-sm font-semibold text-text-primary">Ainda não verificamos</span>
                        </div>

                        <p className="mb-3 text-xs text-text-muted">
                            Prometer validação que não acontece é pior do que não validar.
                        </p>

                        <ul className="flex flex-col gap-2.5">
                            {rules?.unavailable.map((item) => (
                                <li key={item.rule} className="text-[13px]">
                                    <div className="font-medium text-text-secondary">{item.rule}</div>
                                    <div className="text-[11px] leading-snug text-text-muted">{item.reason}</div>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
