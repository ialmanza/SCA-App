import { Routes } from '@angular/router';
import { DecisionComponent } from './components/area-de-decision/decision/decision.component';
import { CrearDecisionComponent } from './components/area-de-decision/crear-decision/crear-decision.component';
import { ListarDecisionesComponent } from './components/area-de-decision/listar-decisiones/listar-decisiones.component';

export const routes: Routes = [
  { path: '', redirectTo: 'crear-decision', pathMatch: 'full' },
  { path: 'decisiones', component: DecisionComponent },
  { path: 'crear-decision', component: CrearDecisionComponent },
  { path: 'listar-decisiones', component: ListarDecisionesComponent }
];
