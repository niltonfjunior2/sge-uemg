"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function DashboardFilters({
  unidades,
  cursos,
}: {
  unidades: { id: number; nome: string }[];
  cursos: { id: number; nome: string; unidadeId: number }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentUnidade = searchParams.get("unidade") || "all";
  const currentCurso = searchParams.get("curso") || "all";

  const filteredCursos = currentUnidade !== "all" 
    ? cursos.filter(c => c.unidadeId === Number(currentUnidade))
    : cursos;

  const handleUnidadeChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("unidade");
      params.delete("curso");
    } else {
      params.set("unidade", value);
      params.delete("curso");
    }
    router.push(`?${params.toString()}`);
  };

  const handleCursoChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("curso");
    } else {
      params.set("curso", value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-md bg-muted/20">
      <div className="flex-1 space-y-1">
        <Label>Unidade Acadêmica</Label>
        <Select value={currentUnidade} onValueChange={handleUnidadeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as Unidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Unidades</SelectItem>
            {unidades.map((u) => (
              <SelectItem key={u.id} value={u.id.toString()}>
                {u.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 space-y-1">
        <Label>Curso</Label>
        <Select value={currentCurso} onValueChange={handleCursoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os Cursos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Cursos</SelectItem>
            {filteredCursos.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
