import { Routes } from '@angular/router';
import { DecisionComponent } from './components/area-de-decision/decision/decision.component';
import { CrearDecisionComponent } from './components/area-de-decision/crear-decision/crear-decision.component';
import { ListarDecisionesComponent } from './components/area-de-decision/listar-decisiones/listar-decisiones.component';
import { DecisionesFormComponent } from './components/area-de-decision/decisiones-form/decisiones-form.component';
import { OpcionComponent } from './components/opciones-de-decision/opcion/opcion.component';
import { CrearOpcionComponent } from './components/opciones-de-decision/crear-opcion/crear-opcion.component';
import { ListarOpcionesComponent } from './components/opciones-de-decision/listar-opciones/listar-opciones.component';
import { LayoutComponent } from './components/layout/layout.component';
import { GrafoComponent } from './components/grafo/grafo.component';
import { PosiblesAlternativasComponent } from './components/posibles-alternativas/posibles-alternativas.component';
import { ModoDeComparacionComponent } from './components/modo-de-comparacion/modo-de-comparacion.component';
import { TablaDeComparacionComponent } from './components/tabla-de-comparacion/tabla-de-comparacion.component';

export const routes: Routes = [
  { path: '', redirectTo: 'layout', pathMatch: 'full' },
  { path: 'decisiones', component: DecisionComponent },
  { path: 'crear-decision', component: CrearDecisionComponent },
  { path: 'listar-decisiones', component: ListarDecisionesComponent },
  { path: 'decisiones-form', component: DecisionesFormComponent },
  { path: 'opciones', component: OpcionComponent },
  { path: 'crear-opcion', component: CrearOpcionComponent },
  { path: 'listar-opciones', component: ListarOpcionesComponent },
  { path: 'layout', component: LayoutComponent },
  { path: 'grafo', component: GrafoComponent },
  { path: 'posibles-alternativas', component: PosiblesAlternativasComponent },
  { path: 'modo-de-comparacion', component: ModoDeComparacionComponent },
  { path: 'tabla-de-comparacion', component: TablaDeComparacionComponent },
];
