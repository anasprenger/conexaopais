export function tempoLeitura(textos: string[]): string {
  const palavras = textos.join(" ").trim().split(/\s+/).filter(Boolean).length;
  const minutos = Math.max(1, Math.round(palavras / 200));
  return `${minutos} min`;
}

export type Artigo = {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  autor: string;
  data: string;
  leitura: string;
  tags?: string[];
  destaque?: boolean;
  conteudo: string[];
  /** Preenchidos apenas quando o conteúdo vem do banco (permite moderação). */
  id?: string;
  autorId?: string;
};

type ArtigoBase = Omit<Artigo, "leitura">;

const artigosBase: ArtigoBase[] = [
  {
    slug: "conversas-dificeis",
    titulo: "Conversas difíceis: como falar sobre sentimentos com crianças",
    resumo:
      "Nomear emoções é o primeiro passo para que a criança aprenda a lidar com elas. Um guia prático para o dia a dia.",
    categoria: "Desenvolvimento",
    autor: "Dra. Helena Prado",
    data: "12 ago 2026",
    tags: ["Emoções", "Diálogo", "Primeira infância"],
    destaque: true,
    conteudo: [
      "Quando uma criança grita, chora ou se fecha, ela não está tentando complicar o dia de quem cuida. Ela está comunicando algo que ainda não sabe traduzir em palavras. A tarefa do adulto, nesses momentos, é menos corrigir e mais emprestar linguagem: dizer o nome daquilo que está acontecendo dentro dela.",
      "Nomear emoções parece simples, mas é um trabalho de repetição. \"Você ficou frustrado porque queria continuar brincando\" ensina mais do que \"não é para chorar por isso\". A primeira frase organiza a experiência; a segunda apenas informa que aquele sentimento não é bem-vindo. Com o tempo, a criança que ouve a primeira frase começa a usá-la sozinha.",
      "Escolha o momento com cuidado. No pico da crise, o corpo está em alerta e quase nada do que é dito entra. Fique perto, ofereça presença física, reduza estímulos e espere. A conversa vem depois, quando a respiração acalma. Ali, sim, vale revisitar o que aconteceu e pensar juntos em outra saída para a próxima vez.",
      "Evite perguntas que fecham o assunto. \"Por que você fez isso?\" costuma gerar defesa ou silêncio. Troque por observações: \"Vi que você ficou muito irritado quando o seu irmão pegou o carrinho.\" Descrever sem julgar abre espaço para que a criança complete a história do jeito dela.",
      "Fale também dos seus sentimentos, em doses adequadas à idade. Uma criança que escuta \"hoje eu estou cansada, preciso de dez minutos quietos\" aprende que emoções não são vergonhosas e que existem formas de cuidar delas. Você se torna, sem discurso, o modelo que ela vai imitar.",
      "Não espere resolução imediata. Muitas conversas importantes acontecem em capítulos: no carro, na hora de dormir, dias depois. O que fica não é a frase perfeita, mas a certeza de que aquele assunto pode ser trazido de novo sem punição.",
      "Se a intensidade das crises interferir no sono, na escola ou nas relações da criança por semanas seguidas, procure ajuda profissional. Pedir apoio não é sinal de fracasso da família: é ampliar a rede de quem cuida.",
    ],
  },
  {
    slug: "avos-e-netos",
    titulo: "Avós e netos: o valor de manter as gerações por perto",
    resumo: "O que a convivência intergeracional ensina — para os dois lados.",
    categoria: "Gerações",
    autor: "Marcos Vilela",
    data: "08 ago 2026",
    tags: ["Avós", "Memória", "Convivência"],
    conteudo: [
      "Existe um tipo de tempo que só os avós têm. Não é o tempo produtivo da rotina, com horários e listas, mas um tempo mais lento, em que se pode contar a mesma história duas vezes e ninguém reclama. Para a criança, esse ritmo é um descanso; para o avô ou a avó, é uma forma de continuar sendo útil e presente.",
      "A convivência entre gerações transmite algo que nenhum aplicativo entrega: pertencimento. Saber de onde veio o nome que se carrega, ouvir como era a casa antiga, entender que os adultos também foram crianças — tudo isso constrói uma noção de história pessoal que sustenta a identidade mais tarde.",
      "Do outro lado, o ganho é igualmente concreto. Idosos que convivem com netos relatam menos solidão e mais sensação de propósito. O cuidado, quando não vira obrigação diária e exaustiva, funciona como vínculo, não como peso.",
      "É aí que entra o combinado entre os adultos. Avós não são creche nem substitutos dos pais. Definir dias, limites e o que é negociável evita o desgaste silencioso que costuma aparecer meses depois, quando alguém se sente usado ou passado por cima.",
      "Diferenças de método vão existir. Doce fora de hora, dormir mais tarde, um pouco mais de tela. Vale escolher as batalhas: o que é questão de saúde e segurança não se negocia; o resto pode ser licença poética da casa dos avós.",
      "Quando a distância física é grande, a chamada de vídeo curta e frequente vale mais do que a longa e rara. Cinco minutos duas vezes por semana criam hábito. E hábito, entre gerações, é o que transforma parentesco em relação.",
    ],
  },
  {
    slug: "rotina-que-acolhe",
    titulo: "Uma rotina que acolhe (e não aprisiona)",
    resumo: "Previsibilidade dá segurança. Rigidez, não. Onde fica o equilíbrio.",
    categoria: "Educação",
    autor: "Bianca Toledo",
    data: "02 ago 2026",
    tags: ["Rotina", "Organização"],
    conteudo: [
      "Rotina não é planilha. É a sensação de saber o que vem depois. Crianças que reconhecem a sequência do dia gastam menos energia tentando adivinhar o mundo e sobra mais para brincar, aprender e se acalmar sozinhas.",
      "Comece pelos três momentos que mais tensionam a casa: acordar, comer e dormir. Se esses ancorarem, o resto se organiza em volta. Não é preciso controlar cada hora do dia para colher o benefício.",
      "O sinal de que a rotina virou prisão é o clima: se o cumprimento do horário produz mais briga do que calma, algo precisa afrouxar. Combinados servem à família, e não o contrário.",
      "Envolva a criança na construção. Ela pode escolher a ordem de duas tarefas, o livro da noite, a música da arrumação. Escolher pequenas coisas reduz a disputa pelas grandes.",
      "Reveja o combinado a cada mudança relevante — nova escola, irmão que nasce, mudança de casa. Rotina que não se atualiza vira discurso repetido que ninguém segue.",
    ],
  },
  {
    slug: "telas-sem-culpa",
    titulo: "Telas sem culpa: combinados possíveis para a família real",
    resumo: "Menos proibição, mais acordo. Como construir limites que se sustentam.",
    categoria: "Convivência",
    autor: "Dr. Rafael Nunes",
    data: "28 jul 2026",
    tags: ["Telas", "Limites", "Acordos"],
    conteudo: [
      "A pergunta \"quanto tempo de tela é permitido?\" costuma esconder outra, mais útil: o que essa tela está substituindo hoje? Meia hora de vídeo depois de uma tarde de parque tem outro peso do que três horas seguidas no lugar de qualquer outra coisa.",
      "Combinados sustentáveis são específicos e visíveis. \"Depois do jantar não tem tela\" funciona melhor do que \"use menos o celular\". Deixe o acordo escrito em algum lugar da casa: reduz a discussão diária, porque a regra deixa de ser humor do adulto.",
      "Avise antes do fim. Interromper de repente gera reação em qualquer idade. Um aviso de cinco minutos e um combinado sobre o que vem depois evitam a maior parte dos conflitos.",
      "Preste atenção ao conteúdo, não só ao relógio. Assistir junto, comentar, escolher o que entra em casa: isso ensina critério, algo que a criança levará para quando você não estiver por perto.",
      "Adultos também entram no acordo. Difícil pedir que a criança desligue durante a refeição enquanto o celular do adulto fica na mesa. O combinado que vale para todos é o único que dura.",
      "Se a tela virou a única forma de acalmar, de comer ou de dormir, vale conversar com um profissional. Não é sobre culpa; é sobre recuperar repertório.",
    ],
  },
];

export const artigos: Artigo[] = artigosBase.map((a) => ({
  ...a,
  leitura: tempoLeitura([a.titulo, a.resumo, ...a.conteudo]),
}));

export type Profissional = {
  slug: string;
  nome: string;
  especialidade: string;
  descricao: string;
  iniciais: string;
  whatsapp: string;
  cidade: string;
  atendimento: string;
};

export const profissionais: Profissional[] = [
  {
    slug: "helena-prado",
    nome: "Dra. Helena Prado",
    especialidade: "Psicologia infantil",
    descricao: "Atende famílias há 15 anos, com foco em vínculo e regulação emocional.",
    iniciais: "HP",
    whatsapp: "5551999990001",
    cidade: "Porto Alegre, RS",
    atendimento: "Presencial e online",
  },
  {
    slug: "rafael-nunes",
    nome: "Dr. Rafael Nunes",
    especialidade: "Pediatria",
    descricao: "Sono, alimentação e desenvolvimento na primeira infância.",
    iniciais: "RN",
    whatsapp: "5551999990002",
    cidade: "Curitiba, PR",
    atendimento: "Presencial",
  },
  {
    slug: "bianca-toledo",
    nome: "Bianca Toledo",
    especialidade: "Pedagogia",
    descricao: "Alfabetização, adaptação escolar e parceria entre escola e família.",
    iniciais: "BT",
    whatsapp: "5551999990003",
    cidade: "São Paulo, SP",
    atendimento: "Online",
  },
  {
    slug: "marcos-vilela",
    nome: "Marcos Vilela",
    especialidade: "Terapia familiar",
    descricao: "Mediação de conflitos e cuidado com idosos na dinâmica familiar.",
    iniciais: "MV",
    whatsapp: "5551999990004",
    cidade: "Belo Horizonte, MG",
    atendimento: "Presencial e online",
  },
];

export type PostColuna = {
  slug: string;
  titulo: string;
  data: string;
  resumo: string;
  texto: string[];
};

export type Coluna = {
  slug: string;
  nome: string;
  colunista: string;
  chamada: string;
  periodicidade: string;
  sobre: string;
  posts: PostColuna[];
};

export const colunas: Coluna[] = [
  {
    slug: "entre-geracoes",
    nome: "Entre Gerações",
    colunista: "Marcos Vilela",
    chamada: "Histórias e reflexões sobre o que passa de avós para netos.",
    periodicidade: "Quinzenal",
    sobre:
      "Uma coluna sobre heranças invisíveis: gestos, receitas, silêncios e frases que atravessam três gerações dentro da mesma casa.",
    posts: [
      {
        slug: "a-cadeira-da-varanda",
        titulo: "A cadeira da varanda",
        data: "14 ago 2026",
        resumo: "Sobre os lugares da casa que guardam memória de quem já não senta mais nela.",
        texto: [
          "Toda casa tem um móvel que ninguém usa e ninguém joga fora. Na casa da minha avó era uma cadeira de vime na varanda, com o assento cedendo no meio. Foi ali que ela contou, durante anos, as mesmas quatro histórias para netos diferentes.",
          "Quando as famílias me procuram para falar de perda, quase sempre aparece um objeto assim. Ele funciona como um lugar de encontro entre o que foi vivido e o que ainda dói. Guardar não é ficar preso; é ter onde chegar quando a saudade aperta.",
          "Meu conselho prático é simples: dê nome ao objeto e conte a história dele em voz alta, para quem for pequeno. Memória que não é narrada se dissolve em uma geração.",
        ],
      },
      {
        slug: "quando-o-avo-precisa-de-cuidado",
        titulo: "Quando o avô passa a precisar de cuidado",
        data: "31 jul 2026",
        resumo: "A inversão de papéis que ninguém ensina e a conversa que é melhor não adiar.",
        texto: [
          "Há um dia em que o carro precisa ficar na garagem, ou em que os remédios passam a ser conferidos por outra pessoa. Esse dia costuma chegar antes da conversa sobre ele, e é aí que a família se desorganiza.",
          "Antecipar é gentileza. Perguntar, com calma e enquanto ainda há autonomia, como aquela pessoa gostaria de ser cuidada evita decisões tomadas na urgência e no ressentimento.",
          "Distribuir tarefas entre os adultos, por escrito, protege quem naturalmente assume tudo — quase sempre uma mulher da família. Cuidado que não é dividido vira adoecimento silencioso.",
        ],
      },
    ],
  },
  {
    slug: "diario-de-quem-cuida",
    nome: "Diário de quem cuida",
    colunista: "Bianca Toledo",
    chamada: "Relatos honestos sobre a rotina de cuidar sem se perder.",
    periodicidade: "Semanal",
    sobre:
      "Anotações de quem vive a rotina por dentro: cansaço, culpa, pequenas vitórias e o direito de não dar conta de tudo.",
    posts: [
      {
        slug: "a-culpa-de-nao-dar-conta",
        titulo: "A culpa de não dar conta",
        data: "18 ago 2026",
        resumo: "Sobre o padrão impossível que a gente aceitou sem perceber.",
        texto: [
          "Nenhuma geração antes da nossa cuidou de crianças com tão pouca rede e tanta plateia. A comparação é constante e o parâmetro é sempre o melhor dia da vida de outra família.",
          "A pergunta que ajuda não é \"estou fazendo o suficiente?\", mas \"o que dá para sustentar nesta semana?\". Cuidado sustentável é o único que continua existindo no mês que vem.",
          "Escolher três prioridades por semana e abandonar o resto, sem drama, é uma prática que recomendo a todas as famílias com quem trabalho.",
        ],
      },
      {
        slug: "domingo-a-tarde",
        titulo: "Domingo à tarde",
        data: "11 ago 2026",
        resumo: "O horário mais difícil da semana e o que fazer com ele.",
        texto: [
          "Existe uma tristeza específica do fim do domingo. Nas casas com crianças, ela costuma virar birra, dor de barriga ou discussão sobre mochila.",
          "Ritualizar essa hora ajuda: uma refeição simples e repetida, uma conversa curta sobre o que vem na semana, algo previsível que sinalize a virada.",
          "Não é preciso resolver a tristeza. Basta não deixá-la sozinha.",
        ],
      },
    ],
  },
  {
    slug: "consultorio-aberto",
    nome: "Consultório aberto",
    colunista: "Dra. Helena Prado",
    chamada: "Perguntas reais de famílias, respondidas com calma.",
    periodicidade: "Mensal",
    sobre:
      "Cada edição responde perguntas enviadas por responsáveis, sem jargão e sem receita pronta.",
    posts: [
      {
        slug: "meu-filho-nao-quer-ir-a-escola",
        titulo: "\"Meu filho não quer ir à escola\"",
        data: "05 ago 2026",
        resumo: "Como diferenciar resistência passageira de sinal de alerta.",
        texto: [
          "A recusa escolar quase nunca é sobre a escola em si. É sobre algo que acontece lá e que ainda não foi dito: um colega, uma dificuldade de aprendizagem, um professor que assusta, uma separação difícil em casa.",
          "Antes de negociar a ida, investigue com perguntas concretas: com quem brincou, o que foi fácil, o que foi chato, quem senta ao lado. Perguntas amplas recebem respostas vazias.",
          "Se a recusa durar mais de duas semanas ou vier com sintomas físicos, converse com a escola e com um profissional. Quanto mais cedo, menor o estrago no vínculo com o aprender.",
        ],
      },
    ],
  },
];

export type Integrante = {
  slug: string;
  nome: string;
  funcao: string;
  descricao: string;
  habilidades: string[];
  iniciais: string;
};

export const equipe: Integrante[] = [
  {
    slug: "ana-sprenger",
    nome: "Ana Sprenger",
    funcao: "Idealizadora e direção editorial",
    descricao:
      "Criou o Conexão Pais a partir da própria experiência de cuidar e da vontade de reunir informação confiável em um lugar acolhedor.",
    habilidades: ["Curadoria de conteúdo", "Comunidade", "Parcerias"],
    iniciais: "AS",
  },
  {
    slug: "helena-prado",
    nome: "Dra. Helena Prado",
    funcao: "Conselho técnico",
    descricao:
      "Psicóloga infantil, revisa os conteúdos publicados e orienta as pautas ligadas a desenvolvimento e vínculo.",
    habilidades: ["Psicologia infantil", "Revisão técnica"],
    iniciais: "HP",
  },
  {
    slug: "marcos-vilela",
    nome: "Marcos Vilela",
    funcao: "Coluna Entre Gerações",
    descricao:
      "Terapeuta familiar, escreve sobre o encontro entre avós, pais e netos e media as conversas da comunidade.",
    habilidades: ["Terapia familiar", "Escrita", "Mediação"],
    iniciais: "MV",
  },
  {
    slug: "bianca-toledo",
    nome: "Bianca Toledo",
    funcao: "Educação e formação",
    descricao:
      "Pedagoga, cuida das pautas de escola, alfabetização e da relação entre família e instituição de ensino.",
    habilidades: ["Pedagogia", "Formação", "Conteúdo"],
    iniciais: "BT",
  },
];

export type PaginaRevista = {
  numero: number;
  secao: string;
  titulo: string;
  texto: string[];
};

export type Revista = {
  slug: string;
  edicao: number;
  titulo: string;
  subtitulo: string;
  descricao: string;
  data: string;
  paginas: number;
  categoria: string;
  destaques: string[];
  pdf: string;
  conteudo: PaginaRevista[];
};

export const revistas: Revista[] = [
  {
    slug: "edicao-03",
    edicao: 3,
    titulo: "O tempo que passamos juntos",
    subtitulo: "Rotina, presença e o que fica das horas em família",
    descricao:
      "Uma edição sobre a qualidade do tempo compartilhado: rotinas possíveis, rituais simples e o valor das pequenas conversas.",
    data: "Agosto de 2026",
    paginas: 4,
    categoria: "Convivência",
    destaques: [
      "Reportagem: a rotina real de cinco famílias",
      "Entrevista com a Dra. Helena Prado",
      "Ensaio fotográfico: avós e netos",
    ],
    pdf: "/revistas/edicao-03.pdf",
    conteudo: [
      {
        numero: 1,
        secao: "Capa",
        titulo: "O tempo que passamos juntos",
        texto: [
          "Edição 03 · Agosto de 2026",
          "Rotina, presença e o que fica das horas em família.",
        ],
      },
      {
        numero: 2,
        secao: "Carta da edição",
        titulo: "Presença não se mede em horas",
        texto: [
          "Passamos meses ouvindo famílias falar de tempo: o que falta, o que sobra e o que se perde na pressa.",
          "Esta edição não traz fórmulas de produtividade doméstica. Traz relatos de casas reais e de pequenas escolhas que mudaram o clima do dia.",
        ],
      },
      {
        numero: 3,
        secao: "Reportagem",
        titulo: "A rotina real de cinco famílias",
        texto: [
          "Cinco casas abriram a agenda de uma semana inteira para a nossa equipe.",
          "O que se repete não é o horário, e sim a existência de um momento fixo em que todos estão no mesmo lugar — mesmo que por vinte minutos.",
          "Quem tem esse momento relata menos conflito na hora de dormir.",
        ],
      },
      {
        numero: 4,
        secao: "Entrevista",
        titulo: "Dra. Helena Prado",
        texto: [
          "\"A criança não precisa de um adulto disponível o tempo todo. Precisa de um adulto previsível.\"",
          "A psicóloga fala sobre vínculo, culpa e o que realmente sustenta a segurança emocional na infância.",
        ],
      },
    ],
  },
  {
    slug: "edicao-02",
    edicao: 2,
    titulo: "Escola e casa, mesma direção",
    subtitulo: "Como construir parceria com quem educa junto",
    descricao:
      "Adaptação escolar, reuniões que funcionam e combinados entre família e escola.",
    data: "Junho de 2026",
    paginas: 3,
    categoria: "Educação",
    destaques: ["Guia da adaptação", "O que perguntar na reunião"],
    pdf: "/revistas/edicao-02.pdf",
    conteudo: [
      {
        numero: 1,
        secao: "Capa",
        titulo: "Escola e casa, mesma direção",
        texto: ["Edição 02 · Junho de 2026", "Parceria com quem educa junto."],
      },
      {
        numero: 2,
        secao: "Guia",
        titulo: "A adaptação escolar, dia por dia",
        texto: [
          "Os primeiros quinze dias definem o tom do ano.",
          "Despedidas curtas, previsíveis e sem barganha reduzem a ansiedade de quem fica e de quem vai.",
        ],
      },
      {
        numero: 3,
        secao: "Prático",
        titulo: "O que perguntar na reunião",
        texto: [
          "Cinco perguntas que rendem mais do que \"como ele está indo?\".",
          "Comece por: com quem ele brinca no recreio?",
        ],
      },
    ],
  },
  {
    slug: "edicao-01",
    edicao: 1,
    titulo: "Começar por aqui",
    subtitulo: "A primeira edição do Conexão Pais",
    descricao:
      "Nossa carta de intenções: por que existimos e o que queremos construir com as famílias.",
    data: "Abril de 2026",
    paginas: 3,
    categoria: "Institucional",
    destaques: ["Manifesto", "Quem faz o Conexão Pais"],
    pdf: "/revistas/edicao-01.pdf",
    conteudo: [
      {
        numero: 1,
        secao: "Capa",
        titulo: "Começar por aqui",
        texto: ["Edição 01 · Abril de 2026", "Ajudando a unir famílias e gerações."],
      },
      {
        numero: 2,
        secao: "Manifesto",
        titulo: "Por que existimos",
        texto: [
          "Informação sobre criar filhos existe de sobra. O que falta é lugar tranquilo para encontrá-la.",
          "Nosso compromisso é com conteúdo revisado por profissionais e escrito em linguagem de gente.",
        ],
      },
      {
        numero: 3,
        secao: "Equipe",
        titulo: "Quem faz o Conexão Pais",
        texto: ["Uma redação pequena e um conselho técnico que revisa cada publicação."],
      },
    ],
  },
];
