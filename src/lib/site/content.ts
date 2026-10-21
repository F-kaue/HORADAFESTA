export const SITE = {
  name: "Hora da Festa",
  tagline: "Buffet móvel e eventos",
  cnpj: "67.206.429/0001-00",
  city: "Caucaia",
  region: "Fortaleza e região metropolitana",
  email: "Horadafestace@gmail.com",
  instagram: "https://instagram.com/horadafesta.oficial",
  instagramHandle: "@horadafesta.oficial",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5585992312677",
  whatsappDisplay: "(85) 99231-2677",
  whatsappMessage:
    "Olá! Vim pelo site da Hora da Festa e quero montar um orçamento.",
} as const;

export const SERVICES = [
  {
    title: "Barraquinhas e estações",
    image: "/images/site/stalls-jardim.jpg",
    alt: "Barraquinhas de madeira da Hora da Festa ao ar livre, com luminárias e equipe",
    lead: "A estrutura de madeira chega montada e vira atrativo do salão.",
    note: "Garçom não entra neste pacote. Se precisar de serviço de mesa, a gente combina à parte.",
    items: [
      "Mini hambúrguer, mini pizza, churros, pipoca e algodão doce",
      "Bowls, molhos, palitos e guardanapos",
      "Montagem e desmontagem da estação",
    ],
  },
  {
    title: "Buffet completo",
    image: "/images/site/mesa-completa.jpg",
    alt: "Mesa de refeição completa com arroz, carnes e saladas",
    lead: "Refeições completas, cardápio variado e apresentação impecável.",
    note: "Neste pacote o garçom está incluso.",
    items: [
      "Comida feita e finalizada no evento",
      "Garçons, copeiras e estrutura",
      "Atendimento personalizado do começo ao fim",
    ],
  },
  {
    title: "Mesa de doces",
    image: "/images/site/doces.jpg",
    alt: "Mesa com canudinhos, empadas e bolo",
    lead: "A mesa doce entra junto quando o evento pede o final açucarado.",
    note: "O cardápio fecha no orçamento, pelo número de convidados.",
    items: [
      "Canudinho, empada e bolo",
      "Montagem da mesa",
      "O que for contratado já vai com o material de servir",
    ],
  },
] as const;

export const CLIPS = [
  {
    src: "/videos/site/barraquinha.mp4",
    poster: "/images/site/posters/barraquinha.jpg",
    caption: "Na barraquinha",
    alt: "Convidada comendo na barraquinha da Hora da Festa, com a equipe ao fundo",
  },
  {
    src: "/videos/site/algodao.mp4",
    poster: "/images/site/posters/algodao.jpg",
    caption: "Algodão doce",
    alt: "Algodão doce sendo enrolado na estação",
  },
  {
    src: "/videos/site/churros.mp4",
    poster: "/images/site/posters/churros.jpg",
    caption: "Churros",
    alt: "Churros na estação de madeira",
  },
  {
    src: "/videos/site/hamburguer.mp4",
    poster: "/images/site/posters/hamburguer.jpg",
    caption: "Mini hambúrguer",
    alt: "Mini hambúrguer montado na hora",
  },
  {
    src: "/videos/site/crepe.mp4",
    poster: "/images/site/posters/crepe.jpg",
    caption: "Na chapa",
    alt: "Salgado gratinando na chapa",
  },
] as const;

export const STALL_PHOTOS = [
  {
    src: "/images/site/stalls-jardim.jpg",
    alt: "Duas barraquinhas de madeira com luminárias no jardim e equipe na chapa",
  },
  {
    src: "/images/site/stalls-luz.jpg",
    alt: "Barraquinha iluminada com lâmpadas de corda",
  },
  {
    src: "/images/site/stalls-salao.jpg",
    alt: "Barraquinhas montadas no salão do evento",
  },
  {
    src: "/images/site/evento-burgers.jpg",
    alt: "Torre de mini hambúrgueres na estação da festa",
  },
] as const;

export const FOOD_PHOTOS = [
  {
    src: "/images/site/evento-burgers.jpg",
    alt: "Mini hambúrgueres em andares na barraquinha",
    caption: "Mini hambúrguer",
  },
  {
    src: "/images/site/mesa-completa.jpg",
    alt: "Mesa de buffet com carnes, arroz e saladas",
    caption: "Buffet completo",
  },
  {
    src: "/images/site/mesa-arroz.jpg",
    alt: "Arroz e acompanhamentos na mesa posta",
    caption: "Mesa posta",
  },
  {
    src: "/images/site/mesa-saladas.jpg",
    alt: "Saladas coloridas no buffet",
    caption: "Saladas",
  },
  {
    src: "/images/site/mesa-carnes.jpg",
    alt: "Carnes no rechaud do buffet",
    caption: "Carnes",
  },
  {
    src: "/images/site/mesa-doces-2.jpg",
    alt: "Mesa completa com pratos, talheres e refeição",
    caption: "Serviço completo",
  },
  {
    src: "/images/site/mesa-festa-2.jpg",
    alt: "Mesa de festa com flores e pratos",
    caption: "Na festa",
  },
  {
    src: "/images/site/evento-crepe-close.jpg",
    alt: "Crepe finalizando na chapa",
    caption: "Na chapa",
  },
] as const;

export const GALLERY = [
  {
    src: "/images/site/stalls-jardim.jpg",
    alt: "Barraquinhas de madeira no jardim",
    caption: "Barraquinhas",
  },
  {
    src: "/images/site/evento-noite.jpg",
    alt: "Casal celebrando na frente da barraquinha",
    caption: "No evento",
  },
  {
    src: "/images/site/mesa-completa.jpg",
    alt: "Buffet completo na mesa",
    caption: "Buffet completo",
  },
  {
    src: "/images/site/evento-burgers.jpg",
    alt: "Mini hambúrgueres na torre",
    caption: "Mini hambúrguer",
  },
  {
    src: "/images/site/stalls-luz.jpg",
    alt: "Barraquinha com luminárias",
    caption: "Estação",
  },
  {
    src: "/images/site/mesa-arroz.jpg",
    alt: "Arroz e acompanhamentos",
    caption: "Mesa posta",
  },
  {
    src: "/images/site/evento-fila.jpg",
    alt: "Convidados na frente das estações",
    caption: "Celebração",
  },
  {
    src: "/images/site/mesa-saladas.jpg",
    alt: "Saladas do buffet",
    caption: "Saladas",
  },
  {
    src: "/images/site/equipe-garcons.jpg",
    alt: "Garçons da Hora da Festa",
    caption: "Equipe",
  },
  {
    src: "/images/site/stalls-salao.jpg",
    alt: "Barraquinhas no salão",
    caption: "No salão",
  },
  {
    src: "/images/site/mesa-carnes.jpg",
    alt: "Carnes no rechaud",
    caption: "Carnes",
  },
  {
    src: "/images/site/evento-crepe-close.jpg",
    alt: "Crepe na chapa",
    caption: "Na chapa",
  },
  {
    src: "/images/site/mesa-doces-2.jpg",
    alt: "Mesa completa com equipe ao fundo",
    caption: "Serviço",
  },
  {
    src: "/images/site/equipe-time.jpg",
    alt: "Time completo da Hora da Festa",
    caption: "Time",
  },
  {
    src: "/images/site/mesa-festa-2.jpg",
    alt: "Mesa de festa com flores",
    caption: "Apresentação",
  },
  {
    src: "/images/site/stalls-dupla.jpg",
    alt: "Duas barraquinhas lado a lado",
    caption: "Estrutura",
  },
  {
    src: "/images/site/evento-servindo.jpg",
    alt: "Equipe servindo no evento",
    caption: "Atendimento",
  },
  {
    src: "/images/site/mesa-pratos.jpg",
    alt: "Pratos e talheres prontos para servir",
    caption: "Detalhe",
  },
] as const;

export const FEEDBACK = [
  {
    src: "/images/site/feedback-9.jpg",
    alt: "Print de feedback de cliente da Hora da Festa",
  },
  {
    src: "/images/site/feedback-8.jpg",
    alt: "Print de feedback de cliente no WhatsApp",
  },
  {
    src: "/images/site/feedback-7.jpg",
    alt: "Print de avaliação após o evento",
  },
  {
    src: "/images/site/feedback-6.jpg",
    alt: "Print de mensagem de cliente satisfeito",
  },
  {
    src: "/images/site/feedback-1.jpg",
    alt: "Print de feedback que a casa ama",
  },
  {
    src: "/images/site/feedback-2.jpg",
    alt: "Print de agradecimento de cliente",
  },
  {
    src: "/images/site/feedback-3.jpg",
    alt: "Print de avaliação no WhatsApp",
  },
  {
    src: "/images/site/feedback-4.jpg",
    alt: "Print de mensagem após a festa",
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: "É tudo feito na hora do evento?",
    a: "Sim. É frito, assado e montado na hora do seu evento. Nada como uma comida servida quentinha.",
  },
  {
    q: "Quais são as formas de pagamento?",
    a: "Cartão em até 12x, com o acréscimo da máquina. Também dá para reservar com 50% e quitar os outros 50% até um dia antes do evento. Para pacotes acima de R$ 2.000, tem crediário próprio: 20% para reservar a data e o restante do jeito que for melhor para você, até 5 dias antes do evento.",
  },
  {
    q: "Eu preciso comprar pratos descartáveis?",
    a: "Não. O que for contratado conosco já vem com bowls, molhos, palitos e guardanapos. Você não precisa se preocupar com isso.",
  },
  {
    q: "Garçom está incluso?",
    a: "Só no pacote de refeição completa. Nas barraquinhas e estações, o garçom é contratado por fora.",
  },
  {
    q: "O deslocamento está incluso?",
    a: "Não. O deslocamento é cobrado pela quilometragem. Manda o endereço no orçamento ou no WhatsApp que a gente calcula.",
  },
  {
    q: "Onde vocês atendem?",
    a: "Caucaia, Fortaleza e a região metropolitana. Fora desse raio, o valor do deslocamento entra na conta junto com o endereço.",
  },
] as const;

export const AREAS = [
  "Caucaia",
  "Fortaleza",
  "Maracanaú",
  "Região metropolitana",
] as const;

export function whatsAppHref(message = SITE.whatsappMessage) {
  const digits = SITE.whatsapp.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message)}`;
}
