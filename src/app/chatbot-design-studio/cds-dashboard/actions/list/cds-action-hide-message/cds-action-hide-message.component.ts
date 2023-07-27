import { Component, Input, OnInit } from '@angular/core';
import { LoggerService } from 'app/services/logger/logger.service';
import { ActionHideMessage } from 'app/models/intent-model';

@Component({
  selector: 'cds-action-hide-message',
  templateUrl: './cds-action-hide-message.component.html',
  styleUrls: ['./cds-action-hide-message.component.scss']
})
export class CdsActionHideMessageComponent implements OnInit {
  
  @Input() action: ActionHideMessage;
  @Input() previewMode: boolean = true;
  text: string;

  constructor(
    private logger: LoggerService
  ) { }

  ngOnInit(): void { 
    this.initialize();
  }

  private initialize(){
    this.text = this.action.text;
  }

  onChangeTextArea(text:string) {
    setTimeout(() => {
      // console.log('onChangeTextarea:: ', text);
      this.action.text = text;
    }, 500);
  }
}
