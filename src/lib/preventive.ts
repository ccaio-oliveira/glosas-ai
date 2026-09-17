import { api } from './api';

export type FindingSeverity = 'error' | 'warning';
export type FindingCategory = 'estrutura' | 'aritmetica' | 'duplicidade' | 'historico';

export interface Finding {
    severity: FindingSeverity;
    category: FindingCategory;
    field: string;
    message: string;
    claim_number: string | null;
    amount_at_risk: number;
}

export interface ValidationResult {
    transaction_type: string | null;
    guide_count: number;
    procedure_count: number;
    error_count: number;
    warning_count: number;
    /** Soma do que está em jogo nos achados. Não é "glosa evitada" — ninguém
     *  pode afirmar que a operadora glosaria. */
    amount_at_risk: number;
    findings: Finding[];
}

export interface RuleSet {
    active: string[];
    unavailable: { rule: string; reason: string }[];
}

export const categoryLabel: Record<FindingCategory, string> = {
    estrutura: 'Estrutura',
    aritmetica: 'Aritmética',
    duplicidade: 'Duplicidade',
    historico: 'Histórico',
};

export async function getPreventiveRules() {
    const res = await api.get<RuleSet>('/api/preventive/rules');
    return res.data;
}

export async function validateGuide(xml: string) {
    const res = await api.post<ValidationResult>('/api/preventive/validate', { xml });
    return res.data;
}
