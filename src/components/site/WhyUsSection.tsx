import Image from "next/image";

export function WhyUsSection() {
  return (
    <section className="bg-[#f6ece4]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#e7d9cc]">
          <Image
            src="/images/site/mesa.jpg"
            alt="Carne sendo finalizada na panela, com o vapor ainda subindo"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight sm:text-5xl">
            A panela abre na festa.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#5c5148]">
            É frito, assado e montado na hora do seu evento. A equipe chega, acende a
            chapa e a comida sai quente, na sua frente.
          </p>
          <p className="mt-4 text-base leading-relaxed text-[#5c5148]">
            O que for contratado já inclui bowls, molhos, palitos e guardanapos.
            Você não compra descartável para servir o que veio da Hora da Festa.
          </p>
        </div>
      </div>
    </section>
  );
}
