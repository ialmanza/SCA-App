import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { DecisionService } from '../../services/decision.service';

// Tipos para nodos y enlaces
interface Node extends d3.SimulationNodeDatum {
  isSelected: boolean;
  id: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

@Component({
  selector: 'app-grafo',
  standalone: true,
  imports: [],
  templateUrl: './grafo.component.html',
  styleUrls: ['./grafo.component.css'],
})
export class GrafoComponent implements OnInit {
  constructor(private decisionService: DecisionService) {}

  ngOnInit(): void {
    this.decisionService.obtenerVinculos().subscribe((vinculos) => {
      const graphData = this.generateGraphData(vinculos);
      this.createGraph(graphData);
    });
  }

  /**
   * Genera datos del grafo a partir de una lista de vínculos.
   */
  private generateGraphData(vinculos: string[]): { nodes: Node[]; links: Link[] } {
    const nodesMap = new Map<string, Node>();
    const links: Link[] = [];

    vinculos.forEach((vinculo) => {
      const [source, target] = vinculo.split(' - ');
      if (source && target) {
        // Crear nodos únicos
        if (!nodesMap.has(source)) {
          nodesMap.set(source, { id: source, isSelected: false });
        }
        if (!nodesMap.has(target)) {
          nodesMap.set(target, { id: target, isSelected: false });
        }
        // Agregar enlace
        links.push({ source, target });
      }
    });

    return {
      nodes: Array.from(nodesMap.values()), // Convertir a array
      links,
    };
  }

  /**
   * Crea el grafo con D3.js.
   */
  private createGraph(data: { nodes: Node[]; links: Link[] }): void {
    const width = 800;
    const height = 600;

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

    // // Dibujar nodos
    // const node = svg
    //   .selectAll<SVGCircleElement, Node>('.node')
    //   .data(data.nodes)
    //   .enter()
    //   .append('circle')
    //   .attr('class', 'node')
    //   .attr('r', 15)
    //   .attr('fill', '#69b3a2')
    //   .call(
    //     d3.drag<SVGCircleElement, Node>()
    //       .on('start', (event, d) => this.dragstarted(event, simulation))
    //       .on('drag', (event, d) => this.dragged(event, simulation))
    //       .on('end', (event, d) => this.dragended(event, simulation)),
    //   );

    const node = svg
    .selectAll<SVGCircleElement, Node>('.node')
    .data(data.nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('r', 15)
    .attr('fill', (d) => (d.isSelected ? '#ff5733' : '#69b3a2')) // Color inicial basado en isSelected
    .on('click', (event, d) => {
      // Cambiar el estado de selección del nodo
      d.isSelected = !d.isSelected;

      // Actualizar el color del nodo según su estado
      d3.select(event.target as SVGCircleElement)
        .attr('fill', d.isSelected ? '#ff5733' : '#69b3a2');
    })
    .call(
      d3.drag<SVGCircleElement, Node>()
        .on('start', (event, d) => this.dragstarted(event, simulation))
        .on('drag', (event, d) => this.dragged(event, simulation))
        .on('end', (event, d) => this.dragended(event, simulation)),
    );


    // Añadir etiquetas a los nodos
    svg
      .selectAll('.label')
      .data(data.nodes)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('font-size', '12px')
      .attr('fill', '#000')
      .attr('text-anchor', 'middle')
      .attr('dy', -20)
      .text((d) => d.id);

    // Actualizar posición de nodos y enlaces en cada tick
    simulation.on('tick', () => {
      // Actualizar posiciones de los enlaces
      link
        .attr('x1', (d: Link) => ((d.source as Node).x ?? 0))
        .attr('y1', (d: Link) => ((d.source as Node).y ?? 0))
        .attr('x2', (d: Link) => ((d.target as Node).x ?? 0))
        .attr('y2', (d: Link) => ((d.target as Node).y ?? 0));

      // Actualizar posiciones de los nodos
      node
        .attr('cx', (d: Node) => d.x ?? 0)
        .attr('cy', (d: Node) => d.y ?? 0);

      // Actualizar posiciones de las etiquetas
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
