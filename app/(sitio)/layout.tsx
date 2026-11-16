import { Grano } from "@/components/marca/Grano";
import { ObservadorRevelar } from "@/components/ui/ObservadorRevelar";

export default function LayoutSitio({ children }: LayoutProps<"/">) {
  return (
    <>
      <Grano />
      <ObservadorRevelar />
      {children}
    </>
  );
}
