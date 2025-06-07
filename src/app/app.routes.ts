import { Routes } from '@angular/router';
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
import { TablaDecisionesComponent } from './components/area-de-decision/tabla-decisiones/tabla-decisiones.component';
import { VinculosComponent } from './components/vinculos/vinculos.component';
import { DecisionCheckComponent } from './components/area-de-decision/decision-check/decision-check.component';
import { PuntuacionesMinimasComponent } from './components/puntuaciones-minimas/puntuaciones-minimas.component';
import { TablaDeSeleccionComponent } from './components/tabla-de-seleccion/tabla-de-seleccion.component';
import { UltimopasoComponent } from './components/ultimopaso/ultimopaso.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { authGuard } from './guards/auth.guard';
import { ProjectComponent } from './components/project/project.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EleccionComponent } from './components/eleccion/eleccion.component';
import { ValidAlternativesComponent } from './components/eleccion/valid-alternatives/valid-alternatives.component';
import { InvalidAlternativesComponent } from './components/eleccion/invalid-alternatives/invalid-alternatives.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'project/:id', component: ProjectComponent, canActivate: [authGuard],
    children: [
      { path: 'crear-decision', component: CrearDecisionComponent },
      { path: 'crear-opcion', component: CrearOpcionComponent },
      { path: 'modo-de-comparacion', component: ModoDeComparacionComponent },
      { path: 'vinculos', component: VinculosComponent },
      { path: 'decisiones-form', component: DecisionesFormComponent },
      { path: 'opciones', component: OpcionComponent },
      { path: 'grafo', component: GrafoComponent },
      { path: 'posibles-alternativas', component: PosiblesAlternativasComponent },
      { path: 'tabla-de-comparacion', component: TablaDeComparacionComponent },
      { path: 'tabla-decisiones', component: TablaDecisionesComponent },
      { path: 'decision-check', component: DecisionCheckComponent },
      { path: 'puntuaciones-minimas', component: PuntuacionesMinimasComponent },
      { path: 'tabla-de-seleccion', component: TablaDeSeleccionComponent },
      { path: 'ultimopaso', component: UltimopasoComponent },
      { path: 'eleccion', component: EleccionComponent },
      { path: 'valid-alternatives', component: ValidAlternativesComponent },
      { path: 'invalid-alternatives', component: InvalidAlternativesComponent },
    ]
  },
  { path: 'crear-decision', component: CrearDecisionComponent, canActivate: [authGuard] },
  { path: 'listar-decisiones', component: ListarDecisionesComponent, canActivate: [authGuard] },
  { path: 'decisiones-form', component: DecisionesFormComponent, canActivate: [authGuard] },
  { path: 'opciones', component: OpcionComponent, canActivate: [authGuard] },
  { path: 'crear-opcion', component: CrearOpcionComponent, canActivate: [authGuard] },
  { path: 'listar-opciones', component: ListarOpcionesComponent, canActivate: [authGuard] },
  { path: 'grafo', component: GrafoComponent, canActivate: [authGuard] },
  { path: 'posibles-alternativas', component: PosiblesAlternativasComponent, canActivate: [authGuard] },
  { path: 'modo-de-comparacion', component: ModoDeComparacionComponent, canActivate: [authGuard] },
  { path: 'tabla-de-comparacion', component: TablaDeComparacionComponent, canActivate: [authGuard] },
  { path: 'tabla-decisiones', component: TablaDecisionesComponent, canActivate: [authGuard] },
  { path: 'vinculos', component: VinculosComponent, canActivate: [authGuard] },
  { path: 'decision-check', component: DecisionCheckComponent, canActivate: [authGuard] },
  { path: 'puntuaciones-minimas', component: PuntuacionesMinimasComponent, canActivate: [authGuard] },
  { path: 'tabla-de-seleccion', component: TablaDeSeleccionComponent, canActivate: [authGuard] },
  { path: 'ultimopaso', component: UltimopasoComponent, canActivate: [authGuard] },
  { path: 'eleccion', component: EleccionComponent, canActivate: [authGuard] },
  { path: 'valid-alternatives', component: ValidAlternativesComponent, canActivate: [authGuard] },
  { path: 'invalid-alternatives', component: InvalidAlternativesComponent, canActivate: [authGuard] },
];
