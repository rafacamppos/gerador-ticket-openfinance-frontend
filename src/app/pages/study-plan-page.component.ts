import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface StudyActivity {
  description: string;
  tool?: string;
}

export interface StudyDiscipline {
  number: string;
  title: string;
  summary: string;
  durationWeeks: number;
  durationHours: number;
  objectives: string[];
  activities: StudyActivity[];
  tags: string[];
}

@Component({
  selector: 'app-study-plan-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './study-plan-page.component.html',
  styleUrl: './study-plan-page.component.css',
})
export class StudyPlanPageComponent {
  readonly totalWeeks = 13;
  readonly totalHours = 130;

  readonly disciplines: StudyDiscipline[] = [
    {
      number: '01',
      title: 'Fundamentos de IA Generativa',
      summary:
        'Base conceitual sobre modelos generativos, LLMs e arquiteturas de IA moderna.',
      durationWeeks: 2,
      durationHours: 20,
      objectives: [
        'Compreender a evolução dos modelos de linguagem, de n-gramas a Transformers',
        'Entender a arquitetura Transformer: atenção, encoders, decoders e self-attention',
        'Diferenciar modelos generativos: GPT, BERT, T5, Llama e suas variações',
        'Conhecer conceitos de tokenização, embeddings e espaço vetorial semântico',
        'Identificar casos de uso reais de IA generativa em negócios financeiros',
      ],
      activities: [
        {
          description: 'Implementar um tokenizador do zero em Python para entender como textos viram tokens',
          tool: 'Python / Jupyter Notebook',
        },
        {
          description: 'Explorar e comparar respostas de ao menos 3 modelos LLM diferentes na mesma tarefa',
          tool: 'OpenAI Playground / Hugging Face Spaces',
        },
        {
          description: 'Reproduzir o paper "Attention Is All You Need" com código comentado',
          tool: 'PyTorch / Google Colab',
        },
        {
          description: 'Criar um mapa mental das arquiteturas de LLMs e suas diferenças',
          tool: 'Miro / Figma',
        },
      ],
      tags: ['Transformers', 'LLMs', 'Embeddings', 'Tokenização', 'GPT'],
    },
    {
      number: '02',
      title: 'Prompt Engineering e Orquestração',
      summary:
        'Técnicas de prompt design, chains e orquestração de respostas com LLMs.',
      durationWeeks: 2,
      durationHours: 20,
      objectives: [
        'Dominar técnicas de prompting: zero-shot, few-shot, chain-of-thought (CoT)',
        'Aplicar estruturas de prompts como RISEN, CRISPE e ReAct para diferentes contextos',
        'Construir pipelines de orquestração com LangChain e LlamaIndex',
        'Implementar sistemas RAG (Retrieval-Augmented Generation) básicos',
        'Medir e comparar a qualidade das respostas com métricas objetivas',
      ],
      activities: [
        {
          description: 'Construir um sistema de Q&A sobre documentos internos usando RAG',
          tool: 'LangChain + OpenAI + FAISS',
        },
        {
          description: 'Criar uma biblioteca de prompts reutilizáveis para 5 casos de uso diferentes',
          tool: 'Python / Markdown',
        },
        {
          description: 'Implementar uma chain multi-step para sumarização e extração de entidades',
          tool: 'LangChain / LlamaIndex',
        },
        {
          description: 'Testar técnicas de prompt injection e documentar mitigações',
          tool: 'Jupyter Notebook',
        },
      ],
      tags: ['Prompt Design', 'Chain-of-Thought', 'RAG', 'LangChain', 'Few-Shot'],
    },
    {
      number: '03',
      title: 'Dados: Preparação e Geração',
      summary:
        'Preparação, armazenamento, curadoria e geração de dados para modelos de IA.',
      durationWeeks: 2,
      durationHours: 20,
      objectives: [
        'Estruturar pipelines de ingestão, limpeza e transformação de dados para LLMs',
        'Utilizar bancos de dados vetoriais para armazenamento de embeddings em escala',
        'Gerar dados sintéticos de qualidade para treino e avaliação de modelos',
        'Aplicar técnicas de chunking e indexação eficiente de documentos',
        'Garantir qualidade, rastreabilidade e governança dos datasets criados',
      ],
      activities: [
        {
          description: 'Criar um pipeline completo de ingestão e indexação de PDFs em banco vetorial',
          tool: 'Python + Pinecone / Weaviate / Chroma',
        },
        {
          description: 'Gerar um dataset sintético de 500 pares pergunta-resposta com LLM',
          tool: 'OpenAI API / Python',
        },
        {
          description: 'Implementar e comparar 3 estratégias de chunking (tamanho fixo, semântico, hierárquico)',
          tool: 'LangChain / LlamaIndex',
        },
        {
          description: 'Construir um painel de qualidade de dados com métricas de cobertura e duplicatas',
          tool: 'Pandas + Streamlit',
        },
      ],
      tags: ['Vector DB', 'Embeddings', 'Chunking', 'Dados Sintéticos', 'Pipeline'],
    },
    {
      number: '04',
      title: 'Treinamento e Avaliação',
      summary:
        'Fine-tuning, ajuste e avaliação de modelos com métricas de qualidade.',
      durationWeeks: 3,
      durationHours: 30,
      objectives: [
        'Compreender as diferenças entre pre-training, fine-tuning e RLHF',
        'Aplicar técnicas de fine-tuning eficiente: LoRA, QLoRA e adaptadores',
        'Configurar e executar experimentos de treinamento com rastreamento de métricas',
        'Avaliar modelos com benchmarks estabelecidos: BLEU, ROUGE, BERTScore, perplexidade',
        'Identificar e mitigar problemas de catastrophic forgetting e overfitting',
      ],
      activities: [
        {
          description: 'Fine-tunar um modelo de 7B parâmetros para classificação de domínio financeiro com LoRA',
          tool: 'HuggingFace PEFT + Llama / Mistral + Google Colab',
        },
        {
          description: 'Construir um dashboard de acompanhamento de experimentos de treinamento',
          tool: 'Weights & Biases / MLflow',
        },
        {
          description: 'Implementar avaliação automática comparando modelo base vs. fine-tuned',
          tool: 'lm-evaluation-harness / Python',
        },
        {
          description: 'Criar um relatório técnico documentando hyperparâmetros, métricas e conclusões',
          tool: 'Jupyter Notebook / Markdown',
        },
      ],
      tags: ['Fine-tuning', 'LoRA', 'QLoRA', 'BLEU', 'ROUGE', 'RLHF'],
    },
    {
      number: '05',
      title: 'Aplicações com LLMs e Agentes',
      summary:
        'Construção de aplicações com Large Language Models e agentes autônomos.',
      durationWeeks: 3,
      durationHours: 30,
      objectives: [
        'Projetar e implementar aplicações end-to-end com LLMs em produção',
        'Desenvolver agentes autônomos com capacidade de planejamento e uso de ferramentas',
        'Integrar LLMs com APIs externas, bancos de dados e sistemas legados',
        'Aplicar padrões de arquitetura: ReAct, Plan-and-Execute, multi-agent',
        'Monitorar aplicações LLM em produção com observabilidade e rastreamento',
      ],
      activities: [
        {
          description: 'Construir um agente financeiro capaz de consultar APIs, calcular indicadores e gerar relatórios',
          tool: 'LangChain Agents + OpenAI Functions / Tool Use',
        },
        {
          description: 'Criar um sistema multi-agente com divisão de tarefas (pesquisador, analista, escritor)',
          tool: 'LangGraph / CrewAI / AutoGen',
        },
        {
          description: 'Implementar observabilidade completa da aplicação com traces e logs estruturados',
          tool: 'LangSmith / Phoenix / OpenTelemetry',
        },
        {
          description: 'Publicar a aplicação em ambiente de produção com API REST documentada',
          tool: 'FastAPI + Docker + Cloud (GCP/AWS/Azure)',
        },
      ],
      tags: ['Agentes', 'ReAct', 'Multi-Agent', 'LangGraph', 'Produção', 'APIs'],
    },
    {
      number: '06',
      title: 'Ética e Responsabilidade em IA',
      summary:
        'Privacidade, governança, vieses e práticas responsáveis no uso de IA.',
      durationWeeks: 1,
      durationHours: 10,
      objectives: [
        'Identificar e avaliar vieses algorítmicos em modelos de linguagem',
        'Aplicar frameworks de IA responsável: NIST AI RMF, EU AI Act, LGPD',
        'Implementar técnicas de detecção de alucinações e grounding de respostas',
        'Definir políticas de uso aceitável e guias de governança para LLMs corporativos',
        'Conhecer regulamentações aplicáveis ao setor financeiro no uso de IA',
      ],
      activities: [
        {
          description: 'Auditar um modelo LLM para identificar vieses em 3 dimensões (gênero, raça, socioeconômico)',
          tool: 'AI Fairness 360 / Evaluate (HuggingFace)',
        },
        {
          description: 'Elaborar uma política de uso de IA generativa para uma instituição financeira fictícia',
          tool: 'Documento / Markdown',
        },
        {
          description: 'Implementar um sistema de detecção de alucinações com NLI (Natural Language Inference)',
          tool: 'HuggingFace Transformers / Python',
        },
        {
          description: 'Conduzir uma análise de risco de um caso de uso real de LLM no setor bancário',
          tool: 'Framework de Risco / Documento',
        },
      ],
      tags: ['Ética', 'Vieses', 'Governança', 'LGPD', 'EU AI Act', 'Alucinações'],
    },
  ];
}
