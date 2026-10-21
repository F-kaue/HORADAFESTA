import Image from "next/image";
import { SiteButton } from "./SiteButton";

export function BuffetSection() {
  return (
    <section id="buffet" className="scroll-mt-24 bg-[#1c1412] text-white">
      <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
        <div className="relative min-h-[460px] lg:min-h-[640px]">
          <Image
            src="/images/site/mesa-completa.jpg"
            alt="Mesa de buffet completo com arroz, carnes e saladas"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1412]/50 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#1c1412]/25" />
        </div>
        <div className="relative flex flex-col justify-center px-5 py-14 sm:px-10 sm:py-20">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(238,95,152,0.28), transparent 45%), radial-gradient(circle at 80% 80%, rgba(61,184,176,0.22), transparent 40%)",
            }}
          />
          <div className="relative">
            <p className="site-kicker !text-[#ff9fc4]">Buffet completo</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
              Sabor e sofisticação na mesa
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/80">
              Oferecemos refeições completas, cardápios variados e uma apresentação impecável para
              tornar o evento ainda mais especial.
            </p>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Com garçons, copeiras e estrutura completa, garantimos praticidade, qualidade e um
              atendimento personalizado. Você celebra, nós cuidamos de cada detalhe.
            </p>
            <ul className="mt-8 grid gap-3">
              {[
                "Garçom incluso neste pacote",
                "Comida finalizada no evento",
                "Bowls, molhos, palitos e guardanapos inclusos",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-semibold"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#3db8b0]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <SiteButton href="/orcamento">Montar meu orçamento</SiteButton>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-5 pb-10 sm:grid-cols-4 sm:px-8 sm:pb-14">
        {[
          { src: "/images/site/mesa-arroz.jpg", alt: "Arroz na mesa posta" },
          { src: "/images/site/mesa-carnes.jpg", alt: "Carnes no rechaud" },
          { src: "/images/site/mesa-saladas.jpg", alt: "Saladas do buffet" },
          { src: "/images/site/mesa-festa-2.jpg", alt: "Mesa de festa com flores" },
        ].map((photo) => (
          <div key={photo.src} className="site-photo-frame relative aspect-[4/3]">
            <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="25vw" />
          </div>
        ))}
      </div>
    </section>
  );
}
