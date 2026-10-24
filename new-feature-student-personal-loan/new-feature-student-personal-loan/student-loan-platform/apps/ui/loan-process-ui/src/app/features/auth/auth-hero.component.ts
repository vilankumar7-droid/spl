import { Component } from '@angular/core';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-auth-hero',
  standalone: true,
  imports: [IconComponent],
  styleUrl: './auth-layout.scss',
  template: `
   <div class="hero">
    <div class="brand"><span class="logo"><app-icon name="school" [size]="22" /></span> Student Finance</div>
    <div>
      <h1>Fund your studies with a clear, step-by-step loan journey.</h1>
      <p class="lead">Apply in minutes, upload documents securely and follow every stage of your application in real time.</p>
      <div class="features">
        <div class="feature"><span class="ic"><app-icon name="calculator" /></span><div><strong>Know your EMI upfront</strong>Live repayment and affordability estimates.</div></div>
        <div class="feature"><span class="ic"><app-icon name="activity" /></span><div><strong>Transparent tracking</strong>See who changed what and why, with a full timeline.</div></div>
        <div class="feature"><span class="ic"><app-icon name="lock" /></span><div><strong>Secure by design</strong>JWT sign-in, role-based access and private documents.</div></div>
      </div>
    </div>
    <div class="foot">Educational demo environment · synthetic data only · no real credit decisions</div>
   </div>`,
})
export class AuthHeroComponent {}
