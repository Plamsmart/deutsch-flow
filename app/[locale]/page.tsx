import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Clases from "@/components/Clases";
import Testimonios from "@/components/Testimonios";
import Contacto from "@/components/Contacto";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Clases />
      <Testimonios />
      <Contacto />
    </>
  );
}
