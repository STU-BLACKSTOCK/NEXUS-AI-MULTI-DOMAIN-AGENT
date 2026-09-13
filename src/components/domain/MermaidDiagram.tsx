import React from "react";
import { GitCommit, ArrowRight, Layers, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface DiagramNodeData {
  id: string;
  label: string;
  description?: string;
}

export interface DiagramEdgeData {
  from_node: string;
  to_node: string;
  label?: string;
}

export interface DiagramSpecData {
  type: "flowchart" | "timeline" | "comparison" | "hierarchy";
  title: string;
  nodes: DiagramNodeData[];
  edges: DiagramEdgeData[];
}

interface MermaidDiagramProps {
  spec: DiagramSpecData;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ spec }) => {
  const { type, title, nodes = [], edges = [] } = spec;

  if (!nodes || nodes.length === 0) return null;

  return (
    <Card className="p-4 bg-muted/20 border-primary/20 backdrop-blur">
      <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</h4>
        </div>
        <Badge variant="outline" className="border-primary/40 text-primary text-[10px] uppercase font-mono">
          {type}
        </Badge>
      </div>

      {/* Visual Sequence / Flow Rendering */}
      {type === "timeline" ? (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-primary/30">
          {nodes.map((node, i) => (
            <div key={node.id || i} className="relative group">
              <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background ring-2 ring-primary/20" />
              <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                <p className="text-xs font-semibold text-foreground">{node.label}</p>
                {node.description && <p className="text-[11px] text-muted-foreground mt-0.5">{node.description}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : type === "comparison" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {nodes.map((node, i) => (
            <div key={node.id || i} className="p-3 rounded-lg bg-card/60 border border-border/50">
              <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary mb-1.5 inline-block">
                Item {i + 1}
              </span>
              <p className="text-xs font-semibold text-foreground">{node.label}</p>
              {node.description && <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{node.description}</p>}
            </div>
          ))}
        </div>
      ) : (
        /* Flowchart / Hierarchy graph */
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {nodes.map((node, idx) => {
              // Find outgoing edge label if any
              const outEdge = edges.find((e) => e.from_node === node.id);
              const isLast = idx === nodes.length - 1 && !outEdge;

              return (
                <React.Fragment key={node.id || idx}>
                  <div className="p-2.5 rounded-lg bg-card/70 border border-border/60 shadow-sm flex-1 min-w-[140px]">
                    <p className="text-xs font-semibold text-foreground font-mono">{node.label}</p>
                    {node.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{node.description}</p>
                    )}
                  </div>
                  {!isLast && (
                    <div className="flex items-center gap-1 text-muted-foreground px-1">
                      {outEdge?.label && <span className="text-[10px] font-mono text-primary/80">{outEdge.label}</span>}
                      <ArrowRight className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};

export default MermaidDiagram;
