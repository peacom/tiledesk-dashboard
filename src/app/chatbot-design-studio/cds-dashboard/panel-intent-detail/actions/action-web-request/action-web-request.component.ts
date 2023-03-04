import { Component, OnInit, Input } from '@angular/core';
import { ActionWebRequest } from 'app/models/intent-model';
import { LoggerService } from 'app/services/logger/logger.service';
import { FormControl } from '@angular/forms';
import { TYPE_METHOD_REQUEST, TEXT_CHARS_LIMIT } from '../../../../utils';

@Component({
  selector: 'cds-action-web-request',
  templateUrl: './action-web-request.component.html',
  styleUrls: ['./action-web-request.component.scss']
})
export class ActionWebRequestComponent implements OnInit {

  @Input() action: ActionWebRequest;
  methods: Array<string>;

  assignTo = new FormControl(); 
  pattern = "^[a-zA-Z_]*[a-zA-Z_]+[a-zA-Z0-9_]*$";

  limitCharsText = TEXT_CHARS_LIMIT;
  jsonHeader: string; 
  jsonBody: string;
  // jsonText: string;
  jsonIsValid = true;
  errorMessage: string;
  methodSelectedHeader = true;
  methodSelectedBody = false;


  headerAttributes: any;

  constructor(
    private logger: LoggerService
  ) { }

  // SYSTEM FUNCTIONS //
  ngOnInit(): void {
    this.initialize();
  }

  
  // CUSTOM FUNCTIONS //
  private initialize(){
    this.methods = Object.values(TYPE_METHOD_REQUEST);
    this.jsonHeader = this.action.headersString;
    this.jsonIsValid = this.isValidJson(this.action.jsonBody);
    if(this.jsonIsValid){
      this.jsonBody = this.action.jsonBody;
      this.jsonBody = this.formatJSON(this.jsonBody, "\t");
    }
  }

  private setActionWebRequest(){
    // this.action.headersString = JSON.stringify(this.jsonHeader);
    // this.action.jsonBody = JSON.stringify(this.jsonBody);
    this.action.jsonBody = this.jsonBody;
  }

  private formatJSON(input, indent) {
    if (input.length == 0) {
      return '';
    }
    else {
      try {
        var parsedData = JSON.parse(input);
        return JSON.stringify(parsedData, null, indent);
      } catch (e) {
        return input;
      }
    }
  }

  private isValidJson(json) {
    try {
      JSON.parse(json);
      this.errorMessage = null;
      return true;
    } catch (e) {
      this.errorMessage = e;
      return false;
    }
  }


  // EVENT FUNCTIONS //
  onChangeMethodButton(e){
    this.action.method = e;
  }

  onChangeTextarea(e){
    this.setActionWebRequest();
    setTimeout(() => {
      this.jsonIsValid = this.isValidJson(this.jsonBody);
    }, 500);
  }

  onChangeParamsButton(){
    if(this.methodSelectedHeader){
      this.methodSelectedHeader = false;
      this.methodSelectedBody = true;
    } else if(this.methodSelectedBody){
      this.methodSelectedHeader = true;
      this.methodSelectedBody = false;
    }
    this.jsonIsValid = this.isValidJson(this.jsonBody);
    this.setActionWebRequest();
  }

  onJsonFormatter(){
      try {
        this.jsonBody = this.formatJSON(this.jsonBody, "\t");
      }
      catch (err) {
        this.logger.error('error:', err);
      }
  }

  onChangeAttributes(attributes:any){
    this.jsonHeader = attributes;
    this.action.headersString = this.jsonHeader;
  }

}
