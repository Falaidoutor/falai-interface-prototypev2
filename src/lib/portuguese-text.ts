const PORTUGUESE_ACCENT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bacao\b/gi, "ação"],
  [/\bacoes\b/gi, "ações"],
  [/\batencao\b/gi, "atenção"],
  [/\bavaliacao\b/gi, "avaliação"],
  [/\bavaliacoes\b/gi, "avaliações"],
  [/\borientacao\b/gi, "orientação"],
  [/\borientacoes\b/gi, "orientações"],
  [/\bobservacao\b/gi, "observação"],
  [/\bobservacoes\b/gi, "observações"],
  [/\bclassificacao\b/gi, "classificação"],
  [/\bclassificacoes\b/gi, "classificações"],
  [/\bclinica\b/gi, "clínica"],
  [/\bclinico\b/gi, "clínico"],
  [/\bmedica\b/gi, "médica"],
  [/\bmedico\b/gi, "médico"],
  [/\bemergencia\b/gi, "emergência"],
  [/\burgencia\b/gi, "urgência"],
  [/\bressuscitacao\b/gi, "ressuscitação"],
  [/\bnao\b/gi, "não"],
  [/\bpressao\b/gi, "pressão"],
  [/\bsaturacao\b/gi, "saturação"],
  [/\bfrequencia\b/gi, "frequência"],
  [/\boxigenio\b/gi, "oxigênio"],
  [/\bnecessario\b/gi, "necessário"],
  [/\bnecessaria\b/gi, "necessária"],
  [/\bpossivel\b/gi, "possível"],
  [/\bimediata\b/gi, "imediata"],
  [/\bimediato\b/gi, "imediato"],
];

export function restorePortugueseAccents(value: string | null | undefined) {
  if (!value) return value ?? null;

  return PORTUGUESE_ACCENT_REPLACEMENTS.reduce((text, [pattern, replacement]) => {
    return text.replace(pattern, (match) => preserveInitialCapital(match, replacement));
  }, value);
}

function preserveInitialCapital(original: string, replacement: string) {
  if (original[0] !== original[0]?.toUpperCase()) return replacement;
  return `${replacement.charAt(0).toUpperCase()}${replacement.slice(1)}`;
}
