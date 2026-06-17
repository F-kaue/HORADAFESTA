import {
  Cake,
  Truck,
  Sparkles,
  Users,
  Building2,
  Heart,
  type LucideIcon,
} from "lucide-react";

export const SITE = {
  name: "Hora da Festa",
  tagline: "Buffet Móvel & Eventos",
  cnpj: "67.206.429/0001-00",
  city: "Caucaia e região",
  region: "Fortaleza/CE",
  email: "Horadafestace@gmail.com",
  instagram: "https://instagram.com/horadafesta.oficial",
  whatsapp:
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5585992312677",
  whatsappMessage:
    "Olá! Vim pelo site da Hora da Festa e gostaria de um orçamento 🎉",
} as const;

export type SiteService = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const SERVICES: SiteService[] = [
  {
    icon: Truck,
    title: "Buffet móvel completo",
    description:
      "Estrutura completa onde você quiser — barraquinhas, buffet e equipe. Sua festa sem preocupação, com sabor e pontualidade.",
  },
  {
    icon: Sparkles,
    title: "Barraquinhas & estação",
    description:
      "Mini hambúrgueres, pipoca, algodão doce e estações temáticas que encantam crianças e adultos.",
  },
  {
    icon: Cake,
    title: "Festas infantis",
    description:
      "Temas exclusivos, docinhos e cardápio pensado para os pequenos — o dia mais especial com carinho em cada detalhe.",
  },
  {
    icon: Users,
    title: "Aniversários & celebrações",
    description:
      "De 15 anos a bodas: cardápios personalizados, montagem e serviço impecável para cada momento.",
  },
  {
    icon: Building2,
    title: "Eventos corporativos",
    description:
      "Coffee breaks, confraternizações e almoços executivos com apresentação profissional.",
  },
  {
    icon: Heart,
    title: "Casamentos & formaturas",
    description:
      "Menus sofisticados e atendimento de alto padrão para os momentos mais importantes da sua vida.",
  },
];

export const STATS = [
  { value: 500, suffix: "+", label: "Festas realizadas", icon: "🎂" },
  { value: 8, suffix: "", label: "Anos de experiência", icon: "🎉" },
  { value: 4.9, suffix: "/5", label: "Avaliação dos clientes", icon: "⭐", decimals: 1 },
  { value: 0, suffix: "", label: "Caucaia e região", icon: "📍", text: true },
] as const;

export const WHY_US = [
  "+8 anos levando buffet móvel até você",
  "Ingredientes frescos e cardápio personalizado",
  "Estrutura completa — montagem e desmontagem",
  "Equipe treinada, uniformizada e pontual",
  "Atendimento humanizado do orçamento ao evento",
  "Atendemos Caucaia, Fortaleza e região metropolitana",
  "Suporte dedicado até o dia da festa",
];

export const TESTIMONIALS = [
  {
    name: "Maria Clara S.",
    event: "Aniversário de 15 anos",
    city: "Fortaleza",
    content:
      "A Raissa transformou a festa da minha filha em algo mágico. Tudo impecável, pontual e muito gostoso!",
    rating: 5,
  },
  {
    name: "Ana Paula M.",
    event: "Festa infantil",
    city: "Caucaia",
    content:
      "Buffet móvel perfeito! Levaram tudo, montaram rápido e os convidados amaram as barraquinhas.",
    rating: 5,
  },
  {
    name: "Roberto F.",
    event: "Confraternização",
    city: "Maracanaú",
    content:
      "Profissionalismo do início ao fim. Cardápio variado e equipe super atenciosa. Recomendo demais!",
    rating: 5,
  },
  {
    name: "Juliana R.",
    event: "Aniversário adulto",
    city: "Fortaleza",
    content:
      "Contratei pelo Instagram e superou expectativas. Orçamento claro e entrega no dia certinho.",
    rating: 5,
  },
];

export const FAQ_ITEMS = [
  {
    q: "Com quanto tempo de antecedência devo contratar?",
    a: "Recomendamos pelo menos 30 dias antes, especialmente para datas como junho e dezembro. Quanto antes, melhor para garantir sua data!",
  },
  {
    q: "Vocês atendem fora de Caucaia?",
    a: "Sim! Atendemos Caucaia, Fortaleza, região metropolitana e interior do Ceará — a logística é combinada no orçamento.",
  },
  {
    q: "O que é o buffet móvel?",
    a: "Levamos estrutura completa até o local do evento: equipamentos, equipe, montagem e desmontagem. Sua festa onde você quiser, sem preocupação.",
  },
  {
    q: "É possível personalizar o cardápio?",
    a: "Absolutamente! Cada evento tem cardápio único, feito sob medida para seu gosto, tema e orçamento.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Trabalhamos com entrada (sinal) + parcelamento do saldo. Os detalhes são combinados na proposta personalizada.",
  },
  {
    q: "Como solicito um orçamento?",
    a: "Pelo formulário online (grátis e rápido), WhatsApp ou Instagram. Respondemos o mais breve possível!",
  },
];

export const GALLERY_IMAGES = [
  { src: "/images/festa/hero.jpg", alt: "Buffet móvel Hora da Festa em evento", title: "Buffet móvel" },
  { src: "/images/festa/buffet-1.jpg", alt: "Estação de mini hambúrgueres", title: "Mini hambúrgueres" },
  { src: "/images/festa/buffet-2.jpg", alt: "Estrutura completa para festa", title: "Estrutura completa" },
  { src: "/images/festa/hero.jpg", alt: "Celebração com convidados", title: "Sua festa" },
  { src: "/images/festa/buffet-1.jpg", alt: "Barraquinhas temáticas", title: "Barraquinhas" },
  { src: "/images/festa/buffet-2.jpg", alt: "Evento ao ar livre", title: "Evento especial" },
];

export function whatsAppHref(message = SITE.whatsappMessage) {
  const digits = SITE.whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
