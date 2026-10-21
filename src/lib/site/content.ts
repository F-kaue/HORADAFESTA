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
    image: "/images/site/stalls-day.jpg",
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
    image: "/images/site/mesa-buffet.jpg",
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

export const STALL_PHOTOS = [
  {
    src: "/images/site/stalls-day.jpg",
    alt: "Duas barraquinhas de madeira com luminárias, no jardim",
  },
  {
    src: "/images/site/stalls-row.jpg",
    alt: "Quatro barraquinhas da Hora da Festa montadas no evento",
  },
  {
    src: "/images/site/stalls-indoor.jpg",
    alt: "Barraquinhas e mesa de buffet no salão",
  },
  {
    src: "/images/site/burgers-tower.jpg",
    alt: "Torre de mini hambúrgueres na estação",
  },
] as const;

export const FOOD_PHOTOS = [
  {
    src: "/images/site/burgers-tower.jpg",
    alt: "Mini hambúrgueres em andares de madeira",
    caption: "Mini hambúrguer",
  },
  {
    src: "/images/site/mesa-buffet.jpg",
    alt: "Mesa de refeição completa no evento",
    caption: "Buffet completo",
  },
  {
    src: "/images/site/mesa-salada.jpg",
    alt: "Mesa posta com arroz, saladas e flores",
    caption: "Mesa posta",
  },
  {
    src: "/images/site/doces.jpg",
    alt: "Mesa de doces com canudinho e bolo",
    caption: "Mesa de doces",
  },
  {
    src: "/images/site/evento-festa.jpg",
    alt: "Convidados na frente das barraquinhas",
    caption: "No evento",
  },
] as const;

export const GALLERY = [
  {
    src: "/images/site/stalls-day.jpg",
    alt: "Barraquinhas de madeira ao ar livre",
    caption: "Barraquinhas",
  },
  {
    src: "/images/site/stalls-row.jpg",
    alt: "Linha de estações da Hora da Festa",
    caption: "Estações no salão",
  },
  {
    src: "/images/site/burgers-tower.jpg",
    alt: "Mini hambúrgueres na torre",
    caption: "Mini hambúrguer",
  },
  {
    src: "/images/site/mesa-buffet.jpg",
    alt: "Buffet completo na mesa",
    caption: "Buffet completo",
  },
  {
    src: "/images/site/mesa-salada.jpg",
    alt: "Mesa posta com saladas e arroz",
    caption: "Mesa posta",
  },
  {
    src: "/images/site/doces.jpg",
    alt: "Mesa de doces",
    caption: "Mesa de doces",
  },
  {
    src: "/images/site/evento-festa.jpg",
    alt: "Convidados com as barraquinhas ao fundo",
    caption: "No evento",
  },
  {
    src: "/images/site/equipe-garcons.jpg",
    alt: "Garçons da Hora da Festa",
    caption: "Equipe",
  },
  {
    src: "/images/site/stalls-indoor.jpg",
    alt: "Barraquinhas e buffet no salão",
    caption: "Estrutura completa",
  },
  {
    src: "/images/site/equipe-time.jpg",
    alt: "Time completo da Hora da Festa",
    caption: "Time",
  },
] as const;

export const FEEDBACK = [
  {
    quote:
      "Você é maravilhosa como pessoa e como profissional. Faz um trabalho impecável. Estava tudo muito delicioso.",
    source: "Cliente no WhatsApp",
  },
  {
    quote:
      "Estava uma delícia. Tudo perfeito, de primeira qualidade. Ano que vem vai ser tudo por sua conta.",
    source: "Marina",
  },
  {
    quote:
      "Simpatia, indicações e o sabor no ponto. A festa ganhou outro clima com a Hora da Festa.",
    source: "Cliente no WhatsApp",
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
  "Eusébio",
  "Aquiraz",
  "Região metropolitana",
] as const;

export function whatsAppHref(message = SITE.whatsappMessage) {
  const digits = SITE.whatsapp.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message)}`;
}
