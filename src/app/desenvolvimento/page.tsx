"use client";

import { useState } from "react";
import { AppFrame } from "@/components/app-frame";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, MessageSquare, Target, UserCheck } from "lucide-react";
import { useAppState } from "@/components/state-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Sub-components to keep the file clean
import { CompetencyMatrixTab } from "./competency-matrix-tab";
import { FeedbackOneOnOneTab } from "./feedback-1on1-tab";

export default function DesenvolvimentoPage() {
  const { state, filters } = useAppState();
  const [selectedPersonId, setSelectedPersonId] = useState<string>("all");

  // Filter people based on global filters
  const filteredPeople = state.people.filter(p => {
    if (p.status === "AFASTADO") return false;
    if (filters.companyId && p.companyId !== filters.companyId) return false;
    if (filters.unitId && p.unitId !== filters.unitId) return false;
    if (filters.teamId && p.teamId !== filters.teamId) return false;
    return true;
  });

  return (
    <AppFrame>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Desenvolvimento & Performance</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe 1-on-1s, Feedbacks e a Matriz de Competências da equipe.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
              <SelectTrigger className="h-9 text-sm bg-background">
                <SelectValue placeholder="Selecione um colaborador..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-semibold text-emerald-600">Visão Geral (Todos)</SelectItem>
                {filteredPeople.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="feedbacks" className="w-full">
          <TabsList className="mb-4 h-9 p-1 bg-muted/50 w-full sm:w-auto overflow-x-auto flex justify-start rounded-lg border border-border/50">
            <TabsTrigger value="feedbacks" className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-3">
              <MessageSquare className="h-3.5 w-3.5" />
              Feedbacks & 1-on-1s
            </TabsTrigger>
            <TabsTrigger value="matriz" className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-3">
              <Brain className="h-3.5 w-3.5" />
              Matriz de Competências
            </TabsTrigger>
            <TabsTrigger value="pdi" className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-3">
              <Target className="h-3.5 w-3.5" />
              Plano de Ação (PDI)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feedbacks" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <FeedbackOneOnOneTab
              selectedPersonId={selectedPersonId === "all" ? null : selectedPersonId}
              filteredPeople={filteredPeople}
            />
          </TabsContent>

          <TabsContent value="matriz" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <CompetencyMatrixTab
              selectedPersonId={selectedPersonId === "all" ? null : selectedPersonId}
              filteredPeople={filteredPeople}
            />
          </TabsContent>

          <TabsContent value="pdi" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="panel p-8 text-center border-dashed">
              <Target className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
              <h3 className="text-sm font-semibold">Planos de Ação (Em Breve)</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Aqui você poderá atrelar metas específicas criadas a partir das reuniões de 1-on-1.
              </p>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </AppFrame>
  );
}
