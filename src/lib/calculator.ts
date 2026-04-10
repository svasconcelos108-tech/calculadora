import { 
  differenceInMonths, 
  differenceInDays, 
  addMonths, 
  startOfYear, 
  endOfYear,
  isBefore,
  isAfter,
  addYears,
  getDaysInYear,
  getMonth,
  getYear
} from 'date-fns';

export type VinculoType = 'estatutario' | 'celetista' | 'temporario';
export type EnteType = 'federal' | 'estadual' | 'municipal';
export type DesligamentoType = 'exoneracao' | 'demissao' | 'aposentadoria' | 'rescisao_indireta' | 'falecimento';

export interface CalculationInput {
  vinculo: VinculoType;
  ente: EnteType;
  dataAdmissao: string;
  dataDesligamento: string;
  ultimaRemuneracao: number;
  mediaRemuneracao?: number;
  feriasVencidas: boolean;
  feriasGozadasPeriodos: number; // Quantos períodos de 30 dias já gozou
  licencasNaoGozadasDias: number;
  adicionalInsalubridade: number;
  adicionalPericulosidade: number;
  adicionalTempoServico: number;
  temFGTS: boolean;
  outrasVerbas: { nome: string; valor: number; justificativa: string }[];
}

export interface CalculationResult {
  verbas: {
    nome: string;
    baseCalculo: number;
    formula: string;
    valor: number;
    fundamentacao: string;
    descricao: string;
  }[];
  total: number;
  observacoes: string[];
}

export function calculateSeverance(input: CalculationInput): CalculationResult {
  const result: CalculationResult = {
    verbas: [],
    total: 0,
    observacoes: []
  };

  const admissao = new Date(input.dataAdmissao);
  const desligamento = new Date(input.dataDesligamento);
  const baseRemuneracao = input.ultimaRemuneracao + 
    input.adicionalInsalubridade + 
    input.adicionalPericulosidade + 
    input.adicionalTempoServico;

  // 1. 13º Salário Proporcional
  // Regra: 1/12 por mês trabalhado ou fração igual ou superior a 15 dias no ano corrente
  const inicioAnoRescisao = startOfYear(desligamento);
  const meses13 = calculateProportionalMonths(inicioAnoRescisao, desligamento);
  
  if (meses13 > 0) {
    const valor13 = (baseRemuneracao / 12) * meses13;
    result.verbas.push({
      nome: '13º Salário Proporcional',
      baseCalculo: baseRemuneracao,
      formula: `(${baseRemuneracao.toFixed(2)} / 12) * ${meses13}`,
      valor: valor13,
      fundamentacao: input.vinculo === 'estatutario' ? 'Lei 8.112/90, Art. 63' : 'Lei 4.090/62, Art. 1º',
      descricao: `Referente a ${meses13}/12 avos do ano de ${getYear(desligamento)}.`
    });
  }

  // 2. Férias Vencidas
  if (input.feriasVencidas) {
    const valorFeriasVencidas = baseRemuneracao;
    const tercoFeriasVencidas = valorFeriasVencidas / 3;
    
    result.verbas.push({
      nome: 'Férias Vencidas',
      baseCalculo: baseRemuneracao,
      formula: `${baseRemuneracao.toFixed(2)}`,
      valor: valorFeriasVencidas,
      fundamentacao: input.vinculo === 'estatutario' ? 'Lei 8.112/90, Art. 78' : 'CLT, Art. 146',
      descricao: 'Período aquisitivo completo e não gozado.'
    });

    result.verbas.push({
      nome: '1/3 Constitucional sobre Férias Vencidas',
      baseCalculo: valorFeriasVencidas,
      formula: `${valorFeriasVencidas.toFixed(2)} / 3`,
      valor: tercoFeriasVencidas,
      fundamentacao: 'Constituição Federal, Art. 7º, XVII',
      descricao: 'Adicional constitucional de 1/3 sobre as férias vencidas.'
    });
  }

  // 3. Férias Proporcionais
  // Calcula meses do último período aquisitivo
  const anosCompletos = Math.floor(differenceInMonths(desligamento, admissao) / 12);
  const inicioUltimoPeriodo = addYears(admissao, anosCompletos);
  const mesesFeriasProp = calculateProportionalMonths(inicioUltimoPeriodo, desligamento);

  if (mesesFeriasProp > 0) {
    const valorFeriasProp = (baseRemuneracao / 12) * mesesFeriasProp;
    const tercoFeriasProp = valorFeriasProp / 3;

    result.verbas.push({
      nome: 'Férias Proporcionais',
      baseCalculo: baseRemuneracao,
      formula: `(${baseRemuneracao.toFixed(2)} / 12) * ${mesesFeriasProp}`,
      valor: valorFeriasProp,
      fundamentacao: input.vinculo === 'estatutario' ? 'Lei 8.112/90, Art. 78, § 3º' : 'CLT, Art. 146, Parágrafo Único',
      descricao: `Referente a ${mesesFeriasProp}/12 avos do período aquisitivo incompleto.`
    });

    result.verbas.push({
      nome: '1/3 Constitucional sobre Férias Proporcionais',
      baseCalculo: valorFeriasProp,
      formula: `${valorFeriasProp.toFixed(2)} / 3`,
      valor: tercoFeriasProp,
      fundamentacao: 'Constituição Federal, Art. 7º, XVII',
      descricao: 'Adicional constitucional de 1/3 sobre as férias proporcionais.'
    });
  }

  // 4. Licenças não gozadas em pecúnia
  if (input.licencasNaoGozadasDias > 0) {
    // Para estatutários, a conversão em pecúnia na aposentadoria/exoneração é pacificada pelo STF (Tema 635)
    const valorLicenca = (baseRemuneracao / 30) * input.licencasNaoGozadasDias;
    result.verbas.push({
      nome: 'Licença-Prêmio/Capacitação em Pecúnia',
      baseCalculo: baseRemuneracao,
      formula: `(${baseRemuneracao.toFixed(2)} / 30) * ${input.licencasNaoGozadasDias}`,
      valor: valorLicenca,
      fundamentacao: 'STF, Tema 635 (Repercussão Geral)',
      descricao: `Indenização de ${input.licencasNaoGozadasDias} dias de licença não gozada para evitar enriquecimento ilícito da Administração.`
    });
  }

  // 5. FGTS (Celetistas)
  if (input.temFGTS && input.vinculo === 'celetista') {
    result.observacoes.push('O saldo do FGTS deve ser verificado diretamente na conta vinculada da CEF.');
    // Nota: Em caso de demissão sem justa causa, haveria multa de 40%, mas no serviço público isso depende da estabilidade.
  }

  // 6. Outras Verbas
  input.outrasVerbas.forEach(v => {
    result.verbas.push({
      nome: v.nome,
      baseCalculo: 0,
      formula: 'Valor informado',
      valor: v.valor,
      fundamentacao: 'Justificativa: ' + v.justificativa,
      descricao: 'Verba inserida manualmente.'
    });
  });

  // Total
  result.total = result.verbas.reduce((acc, v) => acc + v.valor, 0);

  // Observações Jurídicas Gerais
  if (input.vinculo === 'estatutario') {
    result.observacoes.push('Regime Estatutário: Não há direito ao FGTS nem aviso prévio indenizado.');
    result.observacoes.push('A base de cálculo inclui vencimento básico e vantagens pecuniárias permanentes.');
  } else if (input.vinculo === 'temporario') {
    result.observacoes.push('Contrato Temporário: Direitos limitados ao pactuado e à Lei 8.745/93 (ou legislação local).');
  }

  return result;
}

function calculateProportionalMonths(start: Date, end: Date): number {
  let months = differenceInMonths(end, start);
  const lastMonthStart = addMonths(start, months);
  const remainingDays = differenceInDays(end, lastMonthStart);
  
  if (remainingDays >= 15) {
    months += 1;
  }
  
  return months;
}
