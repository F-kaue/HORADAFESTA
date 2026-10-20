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
    image: "/images/site/mesa-2.jpg",
    alt: "Estação de madeira da Hora da Festa com salgados, mini pizzas e luminárias",
    lead: "A estrutura de madeira chega montada. O salgado sai na hora, na sua festa.",
    note: "Garçom não entra neste pacote. Se precisar de serviço de mesa, a gente combina à parte.",
    items: ["Mini hambúrguer, mini pizza, churros e pipoca", "Bowls, molhos, palitos e guardanapos", "Montagem e desmontagem da estação"],
  },
  {
    title: "Refeição completa",
    image: "/images/site/refeicao.jpg",
    alt: "Buffet sendo servido no evento, com a equipe montando o prato",
    lead: "Almoço ou jantar servido quente, com a equipe que já vem no pacote.",
    note: "Neste pacote o garçom está incluso.",
    items: ["Comida feita e finalizada no evento", "Serviço de mesa incluso", "Estrutura e equipe no local"],
  },
  {
    title: "Mesa de doces",
    image: "/images/site/doces.jpg",
    alt: "Mesa com canudinhos, empadas e bolo",
    lead: "A mesa doce entra junto quando o evento pede o final açucarado.",
    note: "O cardápio fecha no orçamento, pelo número de convidados.",
    items: ["Canudinho, empada e bolo", "Montagem da mesa", "O que for contratado já vai com o material de servir"],
  },
] as const;

export const FOOD = [
  { src: "/images/site/burgers.jpg", alt: "Mini hambúrgueres na estação de madeira", caption: "Mini hambúrguer" },
  { src: "/images/site/pizza.jpg", alt: "Mini pizzas recém-saídas", caption: "Mini pizza" },
  { src: "/images/site/churros.jpg", alt: "Churros com granulado", caption: "Churros" },
  { src: "/images/site/pipoca.jpg", alt: "Saquinhos de pipoca na barraquinha", caption: "Pipoca" },
  { src: "/images/site/crepe.jpg", alt: "Espetinhos assando na chapa", caption: "Assado na hora" },
  { src: "/images/site/mesa.jpg", alt: "Carne sendo finalizada na panela, ainda quente", caption: "Na panela" },
] as const;

export const GALLERY = [
  { src: "/images/site/hero.jpg", alt: "Três barraquinhas de madeira da Hora da Festa num salão de festa", caption: "A estrutura no salão" },
  { src: "/images/site/burgers.jpg", alt: "Mini hambúrgueres montados em andares de madeira", caption: "Mini hambúrguer" },
  { src: "/images/site/mesa-2.jpg", alt: "Salgados e mini pizzas expostos na estação", caption: "Estação de salgados" },
  { src: "/images/site/crepe.jpg", alt: "Espetinhos assando na chapa durante o evento", caption: "Assado na hora" },
  { src: "/images/site/churros.jpg", alt: "Churros da estação", caption: "Churros" },
  { src: "/images/site/pipoca.jpg", alt: "Pipoca da barraquinha", caption: "Pipoca" },
  { src: "/images/site/pizza.jpg", alt: "Mini pizzas", caption: "Mini pizza" },
  { src: "/images/site/doces.jpg", alt: "Mesa com canudinhos, empadas e bolo", caption: "Mesa de doces" },
  { src: "/images/site/refeicao.jpg", alt: "Convidados sendo servidos no buffet", caption: "Refeição no evento" },
  { src: "/images/site/mesa.jpg", alt: "Comida sendo finalizada na panela", caption: "Na panela" },
  { src: "/images/site/stalls.jpg", alt: "Barraquinha de madeira da Hora da Festa", caption: "Barraquinha" },
  { src: "/images/site/equipe.jpg", alt: "Equipe da Hora da Festa na estação", caption: "Equipe" },
  { src: "/images/site/festa.jpg", alt: "Anfitriões com a equipe da Hora da Festa", caption: "No evento" },
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

export const AREAS = ["Caucaia", "Fortaleza", "Maracanaú", "Eusébio", "Aquiraz", "Região metropolitana"] as const;

export function whatsAppHref(message = SITE.whatsappMessage) {
  const digits = SITE.whatsapp.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message)}`;
}
