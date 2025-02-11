import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { VinculodbService } from '../../services/_Vinculos/vinculodb.service';
import { DecisionesDBService } from '../../services/_Decisiones/decisiones-db.service';
import { forkJoin } from 'rxjs';

interface Node extends d3.SimulationNodeDatum {
  isSelected: boolean;
  id: string;
  isImportant?: boolean;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

interface VinculoData {
  nombre: string;
  area_id: number;
  related_area_id: number;
}

@Component({
  selector: 'app-grafo',
  standalone: true,
  imports: [],
  providers: [VinculodbService, DecisionesDBService],
  templateUrl: './grafo.component.html',
  styleUrls: ['./grafo.component.css'],
})
export class GrafoComponent implements OnInit {
  constructor(
    private vinculoService: VinculodbService,
    private decisionesService: DecisionesDBService
  ) {}

  ngOnInit(): void {
    forkJoin({
      vinculos: this.vinculoService.getItems(),
      importantAreas: this.decisionesService.getImportantStatus()
    }).subscribe(({ vinculos, importantAreas }) => {
      console.log('Vínculos:', vinculos);
      console.log('Áreas Importantes:', importantAreas);

      // Extract vinculos array from response
      const vinculosList = (vinculos as any).vinculos.map((v: any[]) => ({
        nombre: v[0],
        area_id: v[1],
        related_area_id: v[2]
      }));

      const graphData = this.generateGraphData(vinculosList, importantAreas);
      console.log('Datos del Grafo:', graphData);
      this.createGraph(graphData);
    });
  }

  private generateGraphData(
    vinculos: VinculoData[],
    importantAreas: any[]
  ): { nodes: Node[]; links: Link[] } {
    const nodesMap = new Map<string, Node>();
    const links: Link[] = [];

    vinculos.forEach((vinculo) => {
      // Extract the source and target from the nombre
      const [source, target] = vinculo.nombre.split(' - ');

      if (source && target) {
        // Add source node if it doesn't exist
        if (!nodesMap.has(source)) {
          nodesMap.set(source, {
            id: source,
            isSelected: false,
            isImportant: importantAreas.some(
              area => area.area === source && area.is_important
            )
          });
        }

        // Add target node if it doesn't exist
        if (!nodesMap.has(target)) {
          nodesMap.set(target, {
            id: target,
            isSelected: false,
            isImportant: importantAreas.some(
              area => area.area === target && area.is_important
            )
          });
        }

        // Add link if it doesn't exist
        const existingLink = links.find(
          link =>
            (link.source === source || (typeof link.source === 'object' && link.source.id === source)) &&
            (link.target === target || (typeof link.target === 'object' && link.target.id === target))
        );

        if (!existingLink) {
          links.push({ source, target });
        }
      }
    });

    return {
      nodes: Array.from(nodesMap.values()),
      links,
    };
  }

  private createGraph(data: { nodes: Node[]; links: Link[] }): void {
    const width = document.getElementById('tree-container')?.clientWidth || 800;
    const height = document.getElementById('tree-container')?.clientHeight || 600;

    // Crear SVG
    const svg = d3
      .select('#tree-container')
      .html('') // Limpia el contenedor antes de crear un nuevo grafo
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Crear la simulación
    const simulation = d3
      .forceSimulation<Node>(data.nodes)
      .force(
        'link',
        d3.forceLink<Node, Link>(data.links).id((d) => d.id).distance(100),
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Dibujar enlaces
    const link = svg
      .selectAll('.link')
      .data(data.links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-width', 2);

    // Dibujar nodos
    const node = svg
      .selectAll<SVGCircleElement, Node>('.node')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('r', 15)
      .attr('fill', (d) => {
        if (d.isImportant) return '#ff5733';
        return d.isSelected ? '#ff5733' : '#69b3a2';
      })
      .on('click', (event, d) => {
        if (!d.isImportant) {
          d.isSelected = !d.isSelected;
          d3.select(event.target as SVGCircleElement)
            .attr('fill', d.isSelected ? '#ff5733' : '#69b3a2');
        }
      })
      .call(
        d3.drag<SVGCircleElement, Node>()
          .on('start', (event, d) => this.dragstarted(event, simulation))
          .on('drag', (event, d) => this.dragged(event, simulation))
          .on('end', (event, d) => this.dragended(event, simulation)),
      );

    // Dibujar etiquetas
    svg
      .selectAll('.label')
      .data(data.nodes)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('font-size', '12px')
      .attr('fill', (d) => d.isImportant ? '#ff0000' : '#000')
      .attr('text-anchor', 'middle')
      .attr('dy', -20)
      .text((d) => d.id);

    // Actualizar simulación
    simulation.on('tick', () => {
      link
        .attr('x1', (d: Link) => ((d.source as Node).x ?? 0))
        .attr('y1', (d: Link) => ((d.source as Node).y ?? 0))
        .attr('x2', (d: Link) => ((d.target as Node).x ?? 0))
        .attr('y2', (d: Link) => ((d.target as Node).y ?? 0));

      node
        .attr('cx', (d: Node) => d.x ?? 0)
        .attr('cy', (d: Node) => d.y ?? 0);

      svg
        .selectAll<SVGTextElement, Node>('.label')
        .attr('x', (d: Node) => d.x ?? 0)
        .attr('y', (d: Node) => (d.y ?? 0) - 20);
    });
  }

  private dragstarted(event: any, simulation: d3.Simulation<Node, Link>): void {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  private dragged(event: any, simulation: d3.Simulation<Node, Link>): void {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  private dragended(event: any, simulation: d3.Simulation<Node, Link>): void {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
}
