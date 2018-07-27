import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Project } from '../models/project-model';
import { ActivatedRoute } from '@angular/router';
import { MongodbFaqService } from '../services/mongodb-faq.service';

// USED FOR go back last page
import { Location } from '@angular/common';

@Component({
  selector: 'app-faq-test',
  templateUrl: './faq-test.component.html',
  styleUrls: ['./faq-test.component.scss']
})
export class FaqTestComponent implements OnInit {

  @ViewChild('runtestbtn') private elementRef: ElementRef;
  project: Project;
  questionToTest: string;
  remote_faq_kb_key: string;
  hits: any;
  faq_number_of_found: number;

  constructor(
    private router: Router,
    private auth: AuthService,
    private route: ActivatedRoute,
    private faqService: MongodbFaqService,
    private _location: Location

  ) { }

  ngOnInit() {
    this.getCurrentProject();
    this.getRemoteFaqKbKey();
  }

  getRemoteFaqKbKey() {
    this.remote_faq_kb_key = this.route.snapshot.params['remoteFaqKbKey'];
    console.log('FAQ-KB COMP HAS PASSED remote_faq_kb_key', this.remote_faq_kb_key);
  }

  getCurrentProject() {
    this.auth.project_bs.subscribe((project) => {
      this.project = project
      // console.log('00 -> FAQ-KB EDIT ADD COMP project ID from AUTH service subscription  ', this.project._id)
    });
  }

  // NO MORE USED (SUBSTITUTED BY goBack()) BECAUSE THE FAQ TEST PAGE CAN BE CALLED FROM THE FAQ-KB LIST PAGE (faq-kb.component.ts)
  // AND FROM THE FAQ PAGE (faq.component.ts)
  goBackToFaqKbList() {
    this.router.navigate(['project/' + this.project._id + '/faqkb']);
  }

  goBack() {
    this._location.back();
  }

  searchRemoteFaq() {
    // BUG FIX 'RUN TEST button remains focused after clicking'
    this.elementRef.nativeElement.blur();
    console.log('SEARCH QUESTION ', this.questionToTest)
    this.faqService.searchRemoteFaqByRemoteFaqKbKey(this.remote_faq_kb_key, this.questionToTest)
      .subscribe((remoteFaq) => {
        console.log('REMOTE FAQ FOUND - POST DATA ', remoteFaq);

        if (remoteFaq) {
          this.hits = remoteFaq.hits
          this.faq_number_of_found = remoteFaq.total;
          console.log('REMOTE FAQ LENGHT ', this.faq_number_of_found);

        }

      }, (error) => {
        console.log('REMOTE FAQ - POST REQUEST ERROR ', error);
      }, () => {
        console.log('REMOTE FAQ - POST REQUEST * COMPLETE *');
      });
  }


  goToEditFaqPage(id_faq: string) {
    console.log('ID OF FAQ Pressed', id_faq);

    // this.getFaqById(id_faq);
    // this.router.navigate(['project/' + this.project._id + '/editfaq', this.id_faq_kb, faq_id]);
  }

  getFaqKbIdAndGoToEditFaqPage(id_faq) {
    this.faqService.getMongDbFaqById(id_faq).subscribe((faq: any) => {
      console.log('FAQ GET BY ID', faq);

      if (faq) {
        this.router.navigate(['project/' + this.project._id + '/editfaq', faq.id_faq_kb, id_faq]);
      }

    }, (error) => {
      console.log('FAQ GET BY ID - ERROR ', error);

    }, () => {
      console.log('FAQ GET BY ID - COMPLETE ');

    });
  }

}
