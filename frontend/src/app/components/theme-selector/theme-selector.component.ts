import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ThemeService } from '@app/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-theme-selector',
  templateUrl: './theme-selector.component.html',
  styleUrls: ['./theme-selector.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSelectorComponent implements OnInit, OnDestroy {
  themeSubscription: Subscription;

  constructor(
    private themeService: ThemeService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Two instances of this component may exist; keep both in sync.
    this.themeSubscription = this.themeService.themeChanged$.subscribe(() => {
      this.cd.markForCheck();
    });
  }

  get isLight(): boolean {
    return this.themeService.theme === 'light';
  }

  toggle(): void {
    this.themeService.apply(this.isLight ? 'default' : 'light');
  }

  ngOnDestroy() {
    this.themeSubscription?.unsubscribe();
  }
}
