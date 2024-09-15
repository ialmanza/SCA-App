import { Component } from '@angular/core';
import { NavigationComponent } from "../navigation/navigation.component";
import { DecisionesFormComponent } from "../area-de-decision/decisiones-form/decisiones-form.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [NavigationComponent, DecisionesFormComponent, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {

}
