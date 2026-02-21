"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useAppState } from "./state-provider";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Users, Edit2, GripVertical } from "lucide-react";

export function OrganogramaBoard() {
    const { state, updatePersonData, updateTeam, filters } = useAppState();

    // Local state for inline editing team names
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    const [editingTeamName, setEditingTeamName] = useState("");

    // Fix for React Beautiful DND hydration issues in Next.js
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const currentCompanyId = filters.companyId || state.companies[0]?.id;
    const units = state.units.filter(u => u.companyId === currentCompanyId);

    const handleDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return; // Dropped outside the list
        if (source.droppableId === destination.droppableId && source.index === destination.index) return; // Dropped in the same place

        const targetTeamId = destination.droppableId === "unassigned" ? "null" : destination.droppableId;

        // Update the person's team
        updatePersonData(draggableId, { teamId: targetTeamId }, "MOVER_PESSOA_ORGANOGRAMA");
    };

    const handleTeamNameSave = (teamId: string) => {
        if (editingTeamName.trim()) {
            updateTeam(teamId, { nome: editingTeamName.trim() });
        }
        setEditingTeamId(null);
    };

    const pessoasSemTime = state.people.filter(p => p.companyId === currentCompanyId && (!p.teamId || p.teamId === "null"));

    return (
        <div className="w-full h-full pb-8">
            <DragDropContext onDragEnd={handleDragEnd}>

                {/* Unassigned People Zone */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground p-2 rounded-md bg-muted/20 border-dashed border border-border">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Pessoas Sem Time Alocado</h3>
                        <Badge variant="secondary" className="ml-2">{pessoasSemTime.length}</Badge>
                    </div>

                    <Droppable droppableId="unassigned" direction="horizontal">
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={"flex flex-wrap gap-3 min-h-[80px] p-4 rounded-xl transition-colors " + (snapshot.isDraggingOver ? "bg-muted/50 border border-dashed border-primary/50" : "bg-muted/10 border border-dashed border-border")}
                            >
                                {pessoasSemTime.map((person, index) => (
                                    <Draggable key={person.id} draggableId={person.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={"bg-card border border-border/80 shadow-sm rounded-lg px-4 py-2 flex items-center gap-3 select-none " + (snapshot.isDragging ? "shadow-md ring-1 ring-primary/50 opacity-90" : "hover:border-primary/30")}
                                                style={provided.draggableProps.style}
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                    {person.nome.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">{person.nome}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{(state.roles.find(r => r.id === person.cargoId)?.nome) || "Sem Cargo"}</p>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                                {pessoasSemTime.length === 0 && (
                                    <div className="w-full text-center py-4 text-xs text-muted-foreground">Todos os colaboradores desta empresa possuem times vinculados.</div>
                                )}
                            </div>
                        )}
                    </Droppable>
                </div>

                {/* Organogram Grouped by Units */}
                <div className="space-y-10">
                    {units.map(unit => {
                        const unitTeams = state.teams.filter(t => t.unitId === unit.id);
                        return (
                            <div key={unit.id} className="relative">
                                <div className="sticky left-0 flex items-center gap-2 mb-4">
                                    <div className="h-6 w-1.5 rounded-full bg-blue-500" />
                                    <h2 className="text-lg font-bold text-foreground">Unidade: {unit.nome}</h2>
                                    <Badge variant="outline" className="text-xs text-muted-foreground ml-2">{(unit as any).codigo}</Badge>
                                </div>

                                <div className="flex gap-6 overflow-x-auto pb-6 px-1 snap-x scroll-smooth hide-scrollbar min-h-[300px]">
                                    {unitTeams.map(team => {
                                        const teamPeople = state.people.filter(p => p.teamId === team.id);
                                        return (
                                            <div key={team.id} className="flex-shrink-0 w-80 bg-muted/20 border border-border/50 rounded-2xl flex flex-col snap-start overflow-hidden">
                                                {/* Team Header */}
                                                <div className="p-4 border-b border-border/50 bg-card">
                                                    {editingTeamId === team.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                autoFocus
                                                                value={editingTeamName}
                                                                onChange={(e) => setEditingTeamName(e.target.value)}
                                                                onBlur={() => handleTeamNameSave(team.id)}
                                                                onKeyDown={(e) => e.key === "Enter" && handleTeamNameSave(team.id)}
                                                                className="h-7 text-sm font-bold"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between group cursor-pointer" onClick={() => { setEditingTeamName(team.nome); setEditingTeamId(team.id); }}>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{team.nome}</h3>
                                                                    <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-0.5">{(team as any).departamento}</p>
                                                            </div>
                                                            <Badge variant="secondary" className="font-mono">{teamPeople.length}</Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Droppable Area for Team Members */}
                                                <Droppable droppableId={team.id}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.droppableProps}
                                                            className={"flex-1 p-3 flex flex-col gap-3 min-h-[150px] transition-colors " + (snapshot.isDraggingOver ? "bg-primary/5" : "")}
                                                        >
                                                            {teamPeople.map((person, index) => (
                                                                <Draggable key={person.id} draggableId={person.id} index={index}>
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            className={"bg-background border border-border shadow-sm rounded-xl p-3 flex flex-col gap-2 group select-none " + (snapshot.isDragging ? "shadow-lg ring-2 ring-primary opacity-95 scale-105" : "hover:border-primary/40")}
                                                                            style={provided.draggableProps.style}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div
                                                                                    {...provided.dragHandleProps}
                                                                                    className="text-muted-foreground cursor-grab active:cursor-grabbing hover:bg-muted p-1 rounded transition-colors"
                                                                                >
                                                                                    <GripVertical className="h-4 w-4" />
                                                                                </div>
                                                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                                                                                    {person.nome.charAt(0).toUpperCase()}
                                                                                </div>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <p className="text-sm font-semibold truncate text-foreground">{person.nome}</p>
                                                                                    <p className="text-xs text-muted-foreground truncate">{(state.roles.find(r => r.id === person.cargoId)?.nome) || "Sem Cargo"}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        )
                                    })}

                                    {unitTeams.length === 0 && (
                                        <div className="flex items-center justify-center w-80 min-h-[200px] border border-dashed border-border/60 rounded-xl bg-muted/10 text-sm font-medium text-muted-foreground">
                                            Nenhum time registrado nesta unidade
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}
