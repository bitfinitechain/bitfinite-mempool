import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { MempoolInfo } from '@interfaces/websocket.interface';

interface MempoolInfoData {
  memPoolInfo: MempoolInfo;
  bytesPerSecond: number;
}

@Component({
  selector: 'app-mempool-progress-bar',
  templateUrl: './mempool-progress-bar.component.html',
  styleUrls: ['./mempool-progress-bar.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MempoolProgressBarComponent {
  @Input() mempoolLoadingStatus$: Observable<number> | undefined;
  @Input() mempoolInfoData: MempoolInfoData | undefined;
  @Input() isLoadingWebSocket$: Observable<boolean> | undefined;

  bytesPerSecondLimit = 4000;

  getProgressWidth(): string {
    if (!this.mempoolInfoData) return '0%';
    const percent = Math.round(
      (Math.min(this.mempoolInfoData.bytesPerSecond, this.bytesPerSecondLimit) /
        this.bytesPerSecondLimit) *
        100
    );

    return percent + '%';
  }

  getProgressColor(): string {
    if (!this.mempoolInfoData) return '#4d7bf5';

    const bytesPerSecond = this.mempoolInfoData.bytesPerSecond;
    let progressColor = '#4d7bf5';

    if (bytesPerSecond > 1667) {
      progressColor = '#5b8dff';
    }
    if (bytesPerSecond > 2000) {
      progressColor = '#3b6ef5';
    }
    if (bytesPerSecond > 2500) {
      progressColor = '#1e56ff';
    }
    if (bytesPerSecond > 3000) {
      progressColor = '#0644f1';
    }
    if (bytesPerSecond > 3500) {
      progressColor = '#1e56ff';
    }

    return progressColor;
  }
}
