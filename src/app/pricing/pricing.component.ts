
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { AuthService } from '../core/auth.service';
import { ActivatedRoute, Router } from '@angular/router'
import { UsersService } from '../services/users.service';
import { ProjectService } from '../services/project.service';
import { ProjectPlanService } from '../services/project-plan.service';
import { zip } from 'rxjs';
import { Subscription } from 'rxjs';
import { BrandService } from '../services/brand.service';
import { LoggerService } from '../services/logger/logger.service';
import { AppConfigService } from '../services/app-config.service';
import { TranslateService } from '@ngx-translate/core';
import { PLAN_NAME } from 'app/utils/util';

declare var Stripe: any;

// enum PLAN_NAME {
//   A = 'Growth',
//   B = 'Scale',
//   C = 'Plus',
// }
enum PLAN_DESC {
  Growth = 'Improve customer experience and qualify leads better with premium features',
  Scale = 'Go omni-channel & find your customers where they already are: WhatsApp, Facebook, etc.',
  Plus = 'Exploit all the premium features and receive support to design chatbots tailor-made',
}

enum MONTHLY_PRICE {
  Growth = "19",
  Scale = "79",
  Plus = 'Custom'
}

enum ANNUAL_PRICE {
  Growth = "190",
  Scale = "790",
  Plus = 'Custom'
}

const featuresPlanA = [
  'CRM',
  'Private Notes',
  'Unlimited Conversations History',
  'Working Hours',
  'Email Ticketing',
  'User Ratings',
  'Canned Responses',
  'Webhooks',
  'Email Support',
  'Team Inbox'
]
const highlightedFeaturesPlanA = [
  { 'color': '#a613ec', 'background': 'rgba(166,19,236,.2)', 'feature': '4 Seats' },
  { 'color': '#0d8cff', 'background': 'rgba(13,140,255,.2)', 'feature': '800 Chat/mo.' }
]



const featuresPlanB = [
  'Widget Unbranding',
  'WhatsApp Business',
  'Facebook Messenger',
  'Unlimited Departments',
  'Unlimited Groups',
  'Zapier connector',
  'Data export',
  'Livechat Support',
  'Knowledge Base',
  'Analytics'
]

const highlightedFeaturesPlanB = [
  { 'color': '#a613ec', 'background': 'rgba(166,19,236,.2)', 'feature': '20 Seats' },
  { 'color': '#0d8cff', 'background': 'rgba(13,140,255,.2)', 'feature': '3000 Chat/mo.' }
]

const featuresPlanC = [
  'Dedicated Customer Success Manager',
  'Chatbot Design Assistance',
  'Onboarding and Training',
  'Smart Assignment',
  'IP Filtering',
  'Email Templates Customisation',
  'Activities Log',
  'Ban Visitors',
  'Dialogflow connector',
  'Rasa connector',
  'SMTP Settings',
  'Support to host Tiledesk on your Infrastructure',
  'Premium Customer Support',
]

const highlightedFeaturesPlanC = [
  { 'color': '#a613ec', 'background': 'rgba(166,19,236,.2)', 'feature': 'Tailored solutions' }

]

@Component({
  selector: 'appdashboard-pricing',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss']
})
export class PricingComponent implements OnInit, OnDestroy {
  PLAN_NAME = PLAN_NAME;
  PLAN_DESC = PLAN_DESC;
  MONTHLY_PRICE = MONTHLY_PRICE;
  ANNUAL_PRICE = ANNUAL_PRICE;
  planName: string;
  planDecription: string;
  profileType: string;
  planFeatures: Array<string>;
  annualPrice: string;
  monthlyPrice: string;
  annualPeriod: boolean;
  monthlyPeriod: boolean;
  highlightedFeatures = []
  projectCurrenPlan: string;
  clientReferenceIdForPlanA: string;
  clientReferenceIdForPlanB: string;
  clientReferenceIdForPlanC: string;
  browser_lang: string;
  // company_name = brand.company_name;
  company_name: string;

  projectId: string;
  projectName: string;
  currentUserID: string;
  currentUserEmail: string;

  // operatorNo = 1
  operatorNo: number;
  numberOfAgentPerPrice: number


  selectedPlanName: string;
  proPlanPerAgentPrice = 5;

  yearlyProPlanPerAgentPrice = 4.16;


  displayStipeCheckoutError: any;
  perMonth = true;
  perYear: boolean;

  dshbrdBaseUrl: string;

  displayPaymentReport = 'none'
  displayInfoModal = 'none'

  projectUsersNumber: number;
  showSpinnerInTotalPrice = true;
  info_modal_has_been_displayed = false;
  subscription_id: string;
  subscription: Subscription;

  STRIPE_LIVE_PK: string;

  LIVE_PLAN_X_DAY_20CENTS_PLAN_CODE: string;
  LIVE_PLAN_X_YEAR_PLAN_CODE: string;
  LIVE_PLAN_X_MONTH_PLAN_CODE: string;

  TILEDESK_V2 = true;

  public TEST_PAYMENT_LINKS = true;

  DISPLAY_BTN_PLAN_LIVE_20_CENTSXUNIT_PROD: boolean = false;
  DISPLAY_BTN_PLAN_TEST_3_EURXUNIT_PRE: boolean = false;

  contactUsEmail: string;
  displayClosePricingPageBtn: boolean;
  PAYMENT_LINK_MONTLY_PLAN_A: string;
  PAYMENT_LINK_MONTLY_PLAN_B: string;

  PAYMENT_LINK_ANNUALLY_PLAN_A: string;
  PAYMENT_LINK_ANNUALLY_PLAN_B: string;
  PAYMENT_LINK_PLAN_C: string;

  constructor(
    public location: Location,
    public auth: AuthService,
    private route: ActivatedRoute,
    private usersService: UsersService,
    public projectService: ProjectService,
    private prjctPlanService: ProjectPlanService,
    public brandService: BrandService,
    private logger: LoggerService,
    public appConfigService: AppConfigService,
    private translate: TranslateService,
    private router: Router
  ) {

    const brand = brandService.getBrand();
    this.company_name = brand['company_name'];
    this.contactUsEmail = brand['contact_us_email'];
  }

  /**
   * FOR TEST PLANS in the Stripe Dashboard> Developers> Webhook> Webhook Details click Update details and enter
   * in endpoint URL:
   *  
   *  * to test from localhost start ngrok and replace the initial part of the url
   *    http://03caec73.ngrok.io/modules/payments/stripe/webhook
   *  https://98bf-151-57-59-176.eu.ngrok.io/modules/payments/stripe/webhook 
   * 
   *  Note: to create an ngrok tunnel run: ./ngrok http  http://localhost:3000/
   * 
   *  * to test in in PRE 
   *    https://tiledesk-server-pre.herokuapp.com/modules/payments/stripe/webhook
   * 
   */


  ngOnInit() {
    this.auth.checkRoleForCurrentProjectAndRedirectAdminAndAgent(); // redirect admin and ahent -- only owner has access to payment
    this.getCurrentProject();
    this.selectedPlanName = 'pro'
    this.getBaseUrl()
    // this.getAllUsersOfCurrentProject();
    this.getNoOfProjectUsersAndPendingInvitations();

    this.getProjectPlan();

    this.setPlansPKandCode();
    this.setpaymentLinks()
    this.getRouteParamsAndAppId();



    this.planName = PLAN_NAME.A
    this.planDecription = PLAN_DESC[PLAN_NAME.A]
    this.planFeatures = featuresPlanA;
    this.highlightedFeatures = highlightedFeaturesPlanA
    this.monthlyPeriod = true;
    this.annualPeriod = false;
    this.monthlyPrice = MONTHLY_PRICE[PLAN_NAME.A]

    // console.log('[PRICING] ROUTER URL ', this.router.url)
    const current_url = this.router.url;
    // console.log('[PRICING] current_url ', current_url)
    var n = current_url.lastIndexOf('/');
    var valueAfterLastString = current_url.substring(n + 1);
    // console.log('[PRICING] valueAfterLastString ', valueAfterLastString)
    if (valueAfterLastString === 'pricing') {
      this.displayClosePricingPageBtn = true;
    } else {
      this.displayClosePricingPageBtn = false;
    }
  }


  getCurrentProject() {
    this.auth.project_bs.subscribe((project) => {
      if (project) {
        this.logger.log('[PRICING] - project ', project)
        this.projectId = project._id;
        this.logger.log('[PRICING] - projectId ', this.projectId)
        this.projectName = project.name;

        if (this.projectId) {
          this.getCurrentUser();
        }
      }
    });
  }

  getCurrentUser() {
    const user = this.auth.user_bs.value

    this.logger.log('[PRICING]  Component user ', user);
    if (user) {
      this.currentUserID = user._id
      this.currentUserEmail = user.email
      this.logger.log('[PRICING] USER UID ', this.currentUserID);
      this.logger.log('[PRICING] USER email ', this.currentUserEmail);

      this.clientReferenceIdForPlanA = this.currentUserID + '_' + this.projectId + '_' + PLAN_NAME.A
      // console.log('[PRICING] clientReferenceIdForPlanA ', this.clientReferenceIdForPlanA)
      this.clientReferenceIdForPlanB = this.currentUserID + '_' + this.projectId + '_' + PLAN_NAME.B
      // console.log('[PRICING] clientReferenceIdForPlanB ', this.clientReferenceIdForPlanB)
      this.clientReferenceIdForPlanC = this.currentUserID + '_' + this.projectId + '_' + PLAN_NAME.C
      // console.log('[PRICING] clientReferenceIdForPlanB ', this.clientReferenceIdForPlanC)
    } else {
      // this.logger.log('No user is signed in');
    }
  }
  setpaymentLinks() {
    if (this.TEST_PAYMENT_LINKS === true) {
      this.PAYMENT_LINK_MONTLY_PLAN_A = "https://buy.stripe.com/test_3cseVQ6TIadkd8Y4gg";
      this.PAYMENT_LINK_ANNUALLY_PLAN_A = "https://buy.stripe.com/test_8wMbJE4LA3OW9WMeUV";
      this.PAYMENT_LINK_MONTLY_PLAN_B = "https://buy.stripe.com/test_7sI6pkce24T0d8YdQT";
      this.PAYMENT_LINK_ANNUALLY_PLAN_B = "https://buy.stripe.com/test_fZeeVQ6TI85cglabIK";
      this.PAYMENT_LINK_PLAN_C = "https://buy.stripe.com/test_4gw1502Ds5X4ed26ot";
    } else if (this.TEST_PAYMENT_LINKS === false) {
      this.PAYMENT_LINK_MONTLY_PLAN_A = "https://buy.stripe.com/aEU3ckc8ug3wdGwdQS";
      this.PAYMENT_LINK_ANNUALLY_PLAN_A = "https://buy.stripe.com/28oaEM1tQeZs6e4fYZ";
      this.PAYMENT_LINK_MONTLY_PLAN_B = "https://buy.stripe.com/8wM9AI0pMeZsbyo28c";
      this.PAYMENT_LINK_ANNUALLY_PLAN_B = "https://buy.stripe.com/8wM14cc8ug3weKA003";
     
    }
  }

  // -------------------------------
  // PLAN A 
  // -------------------------------
  openPaymentLinkMontlyPlanA() {
    // console.log('[PRICING] PLAN A Montly')
    // const url = `https://buy.stripe.com/test_3cseVQ6TIadkd8Y4gg?prefilled_email=${this.currentUserEmail}&client_reference_id=${this.clientReferenceIdForPlanA}&locale=${this.browser_lang}`
    const url = `${this.PAYMENT_LINK_MONTLY_PLAN_A}?prefilled_email=${this.currentUserEmail}&client_reference_id=${this.clientReferenceIdForPlanA}&locale=${this.browser_lang}"`
    window.open(url, '_self');
  }

  openPaymentLinkAnnuallyPlanA() {
    // console.log('[PRICING] PLAN A Annually')
    // const url = `https://buy.stripe.com/test_8wMbJE4LA3OW9WMeUV?prefilled_email=${this.currentUserEmail}&client_reference_id=${this.clientReferenceIdForPlanA}&locale=${this.browser_lang}`
    const url = `${this.PAYMENT_LINK_ANNUALLY_PLAN_A}?prefilled_email=${this.currentUserEmail}&client_reference_id=${this.clientReferenceIdForPlanA}&locale=${this.browser_lang}`
    window.open(url, '_self');
  }

  // -------------------------------
  // PLAN B 
  // -------------------------------
  openPaymentLinkMontlyPlanB() {
    // console.log('[PRICING] PLAN B Montly')
    // const url = `https://buy.stripe.com/test_7sI6pkce24T0d8YdQT?prefilled_email=${this.currentUserEmail}&client_reference_id=${this.clientReferenceIdForPlanB}&locale=${this.browser_lang}`
    const url = `${this.PAYMENT_LINK_MONTLY_PLAN_B}?prefilled_email=${this.currentUserEmail}&client_reference_id=${this.clientReferenceIdForPlanB}&locale=${this.browser_lang}`
    window.open(url, '_self');
  }

  openPaymentLinkAnnuallyPlanB() {
    // console.log('[PRICING] PLAN B Annually')
    // const url = `https://buy.stripe.com/test_fZeeVQ6TI85cglabIK?prefilled_email=${this.currentUserEmail}&client_reference_id=${this.clientReferenceIdForPlanB}&locale=${this.browser_lang}`
    const url = `${this.PAYMENT_LINK_ANNUALLY_PLAN_B}?prefilled_email=${this.currentUserEmail}&client_reference_id=${this.clientReferenceIdForPlanB}&locale=${this.browser_lang}`
    window.open(url, '_self');
  }

  openPaymentLinkPlanC() {
    // console.log('[PRICING] PLAN C')
    // const url = `https://buy.stripe.com/test_4gw1502Ds5X4ed26ot?prefilled_email=${this.currentUserEmail}&client_reference_id=${this.clientReferenceIdForPlanC}&locale=${this.browser_lang}`
    const url = `${this.PAYMENT_LINK_PLAN_C}?prefilled_email=${this.currentUserEmail}&client_reference_id=${this.clientReferenceIdForPlanC}&locale=${this.browser_lang}`
    window.open(url, '_self');
  }

  contactUs(planname) {
    // console.log('[PRICING] contactUs planname ', planname)
    window.open(`mailto:sales@tiledesk.com?subject=Upgrade to Tiledesk ${planname}`);
  }


  updatesubscription(price) {
    this.projectService.updatesubscription(price).subscribe((updatesubscription: any) => {
      this.logger.log('[PRICING] - updatesubscription RES ', updatesubscription);

    }, error => {
      this.logger.error('[PRICING] - updatesubscription - ERROR: ', error);
    }, () => {
      this.logger.log('[PRICING] - updatesubscription * COMPLETE *')
    });

  }


  selected_Plan(planname) {
    this.planFeatures = [];
    this.highlightedFeatures = [];
    this.planName = planname;


    // console.log('select plan name', planname)
    this.planDecription = PLAN_DESC[planname]
    // console.log('select planDecription', this.planDecription);

    if (planname === PLAN_NAME.A) {
      // console.log(' PLAN A Features')
      this.planFeatures = featuresPlanA;
      this.highlightedFeatures = highlightedFeaturesPlanA;
    }
    if (planname === PLAN_NAME.B) {
      // console.log(' PLAN B Features')
      this.planFeatures = featuresPlanB;
      this.highlightedFeatures = highlightedFeaturesPlanB;
    }

    if (planname === PLAN_NAME.C) {
      // console.log(' PLAN C Features');
      this.planFeatures = featuresPlanC;
      this.highlightedFeatures = highlightedFeaturesPlanC;
    }

    this.selectedPeriod('monthly')
  }

  selectedPeriod(period) {
    // console.log('selectedPeriod > select plan name', this.planName)
    // console.log('selectedPeriod > select period', period)
    // annualPeriod: boolean; 
    // monthlyPeriod: boolean; 
    if (period === 'monthly') {
      this.monthlyPeriod = true;
      this.annualPeriod = false;
      if (this.planName === PLAN_NAME.A) {
        this.monthlyPrice = MONTHLY_PRICE[PLAN_NAME.A]
      }
      if (this.planName === PLAN_NAME.B) {
        this.monthlyPrice = MONTHLY_PRICE[PLAN_NAME.B]
      }
      if (this.planName === PLAN_NAME.C) {
        this.monthlyPrice = MONTHLY_PRICE[PLAN_NAME.C]
      }

    }

    if (period === 'annual') {
      this.monthlyPeriod = false;
      this.annualPeriod = true;
      if (this.planName === PLAN_NAME.A) {
        this.annualPrice = ANNUAL_PRICE[PLAN_NAME.A]
      }
      if (this.planName === PLAN_NAME.B) {
        this.annualPrice = ANNUAL_PRICE[PLAN_NAME.B]
      }
      if (this.planName === PLAN_NAME.C) {
        this.annualPrice = ANNUAL_PRICE[PLAN_NAME.C]
      }
    }
  }

  getBrowserLanguage() {
    this.browser_lang = this.translate.getBrowserLang();
    // console.log('[PRICING] - browser_lang ', this.browser_lang)
  }

  getRouteParamsAndAppId() {
    const appID = this.appConfigService.getConfig().firebase.appId;
    this.logger.log('[PRICING] GET ROUTE-PARAMS & APPID - APP ID: ', appID);

    this.route.queryParams.subscribe((params) => {
      this.logger.log('[PRICING] - GET ROUTE-PARAMS & APPID - params: ', params)
      if (params.nk) {
        this.logger.log('[PRICING] -  GET ROUTE-PARAMS & APPID - params.nk: ', params.nk)
        if (params.nk === 'y' && appID === "1:92907897826:web:f255664014a7cc14ee2fbb") {
          this.DISPLAY_BTN_PLAN_LIVE_20_CENTSXUNIT_PROD = true;
          this.logger.log('[PRICING] - ROUTE-PARAMS DISPLAY_BTN_PLAN_LIVE_20_CENTSXUNIT_PROD', this.DISPLAY_BTN_PLAN_LIVE_20_CENTSXUNIT_PROD)
        }
        if (params.nk === 'y' && appID === "1:269505353043:web:b82af070572669e3707da6") {
          this.DISPLAY_BTN_PLAN_TEST_3_EURXUNIT_PRE = true;
          this.logger.log('[PRICING] - ROUTE-PARAMS DISPLAY_BTN_PLAN_TEST_3_EURXUNIT_PRE', this.DISPLAY_BTN_PLAN_TEST_3_EURXUNIT_PRE)
        }
      }
    });
  }

  setPlansPKandCode() {
    if (this.TILEDESK_V2 === true) {
      this.logger.log('[PRICING] - TILEDESK_V2 ?', this.TILEDESK_V2)
      this.STRIPE_LIVE_PK = 'pk_live_ED4EiI7FHgu0rv4lEHAl8pff00n2qPazOn';
      this.LIVE_PLAN_X_MONTH_PLAN_CODE = 'plan_H3i8qRroJqwO6K';
      this.LIVE_PLAN_X_YEAR_PLAN_CODE = 'plan_H3iDFGtPN8coKT';
      this.LIVE_PLAN_X_DAY_20CENTS_PLAN_CODE = 'plan_H3iIUMonLu2jIW';

    } else {
      this.logger.log('[PRICING] - TILEDESK_V2 ?', this.TILEDESK_V2)
      this.STRIPE_LIVE_PK = 'pk_live_XcOe1UfJm9GkSgreETF7WGsc';
      this.LIVE_PLAN_X_MONTH_PLAN_CODE = 'plan_FrXJ00oxr0akaF';
      this.LIVE_PLAN_X_YEAR_PLAN_CODE = 'plan_FrXjIcRD20tsAN';
      this.LIVE_PLAN_X_DAY_20CENTS_PLAN_CODE = 'plan_FqRflmxFPy6AOn';


    }
  }

  getProjectPlan() {
    this.subscription = this.prjctPlanService.projectPlan$.subscribe((projectProfileData: any) => {
      // console.log('[PRICING] - getProjectPlan - project Profile Data ', projectProfileData)
      if (projectProfileData) {

        this.subscription_id = projectProfileData.subscription_id;
        this.projectCurrenPlan = projectProfileData.profile_name
        this.profileType = projectProfileData.profile_type

        // console.log('[PRICING]  - getProjectPlan > subscription_id ', this.subscription_id)
        // console.log('[PRICING]  - getProjectPlan > projectCurrenPlan ', this.projectCurrenPlan)
        // console.log('[PRICING]  - getProjectPlan > profileType ', this.profileType)
      }
    }, error => {

      this.logger.error('[PRICING] - getProjectPlan - ERROR', error);
    }, () => {

      // console.log('[PRICING] - getProjectPlan * COMPLETE *')

    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getNoOfProjectUsersAndPendingInvitations() {
    // https://stackoverflow.com/questions/44004144/how-to-wait-for-two-observables-in-rxjs
    const projectUsers = this.usersService.getProjectUsersByProjectId();
    const pendingInvitation = this.usersService.getPendingUsers();
    zip(projectUsers, pendingInvitation, (_projectUsers: any, _pendingInvitation: any) => ({ _projectUsers, _pendingInvitation }))
      .subscribe(pair => {
        // console.log('[PRICING]  - PAIR _projectUsers: ', pair._projectUsers);
        // console.log('[PRICING]  - PAIR _pendingInvitation: ', pair._pendingInvitation);

        if (pair) {
          const NoOfProjectUsers = pair._projectUsers.length
          const NoOfPendingInvitians = pair._pendingInvitation.length

          this.projectUsersNumber = NoOfProjectUsers + NoOfPendingInvitians;
          this.operatorNo = NoOfProjectUsers + NoOfPendingInvitians;
          this.logger.log('[PRICING] - PAIR operatorNo (sum of NoOfProjectUsers + NoOfPendingInvitians): ', this.operatorNo);
          this.numberOfAgentPerPrice = this.operatorNo * this.proPlanPerAgentPrice;
          // console.log('[PRICING] - PAIR numberOfAgentPerPrice: ', this.operatorNo);
        }
      }, error => {
        this.showSpinnerInTotalPrice = false;
        this.logger.error('[PRICING] - PAIR * ERROR: ', error);
      }, () => {
        this.showSpinnerInTotalPrice = false;
        this.logger.log('[PRICING] - PAIR * COMPLETE');
      });
  }

  getAllUsersOfCurrentProject() {
    this.usersService.getProjectUsersByProjectId().subscribe((projectUsers: any) => {
      this.logger.log('[PRICING] - PROJECT USERS (FILTERED FOR PROJECT ID)', projectUsers);

      if (projectUsers) {
        this.projectUsersNumber = projectUsers.length
        this.logger.log('[PRICING] - PROJECT USERS (FILTERED FOR PROJECT ID) projectUsersNumber', this.projectUsersNumber);


        this.operatorNo = projectUsers.length
        this.numberOfAgentPerPrice = this.operatorNo * this.proPlanPerAgentPrice;
      }
    }, error => {
      this.showSpinnerInTotalPrice = false;
      this.logger.error('[PRICING] - PROJECT USERS (FILTERED FOR PROJECT ID) - ERROR', error);
    }, () => {
      this.showSpinnerInTotalPrice = false;
      this.logger.log('[PRICING] - PROJECT USERS (FILTERED FOR PROJECT ID) - COMPLETE');
    });
  }




  getBaseUrl() {
    const href = window.location.href;
    this.logger.log('[PRICING] href ', href)

    const hrefArray = href.split('/#/');
    this.dshbrdBaseUrl = hrefArray[0]

    this.logger.log('[PRICING] dshbrdBaseUrl ', this.dshbrdBaseUrl)
    // var url = new URL(href);
    // this.dashboardHost = url.origin
    // this.logger.log('[PRICING] host ', this.dashboardHost)
  }






  setPeriod(selectedPeriod: string) {
    this.logger.log('[PRICING] - selectedPeriod ', selectedPeriod);
    if (selectedPeriod === 'perMonth') {
      this.perMonth = true;
      this.perYear = false;
    } else if (selectedPeriod === 'perYear') {
      this.perYear = true;
      this.perMonth = false;
    }
  }

  decreaseOperatorNumber() {
    if (this.operatorNo > this.projectUsersNumber) {
      this.operatorNo -= 1;
    } else {
      this.openInfoModal()
    }

    this.logger.log('[PRICING] - decreaseOperatorNumber operatorNo', this.operatorNo);
    // this.switchPlanPrice()
    this.numberOfAgentPerPrice = this.operatorNo * this.proPlanPerAgentPrice;
    //
    // if ((this.operatorNo <= this.projectUsersNumber) && (this.info_modal_has_been_displayed === false)) {

    //   this.openInfoModal()
    // }
  }

  openInfoModal() {
    // if (this.operatorNo === this.projectUsersNumber) {
    this.displayInfoModal = 'block'

    // this.info_modal_has_been_displayed = true;
    // }
  }

  closeInfoModal() {
    this.displayInfoModal = 'none'
  }

  increaseOperatorNumber() {
    this.operatorNo += 1;

    // this.switchPlanPrice()
    this.numberOfAgentPerPrice = this.operatorNo * this.proPlanPerAgentPrice;
  }



  goBack() {
    this.location.back();
  }


  /**
   **! *** *** *** *** *** *** *** *** *** ** !*
   **!        PRO PLAN X MOUNTH - LIVE        !*
   **! *** *** *** *** *** *** *** *** *** ** !*
   */
  stripeProPlanPerMonthCheckout() {
    const that = this;
    this.logger.log('[PRICING] - clicked on stripeProPlanPerMonthCheckout (LIVE) ');

    // const stripe = Stripe('pk_test_lurAeBj5B7n7JGvE1zIPIFwV');
    // const stripe = Stripe('pk_live_XcOe1UfJm9GkSgreETF7WGsc');
    const stripe = Stripe(this.STRIPE_LIVE_PK);

    // ID OF THE TEST MONTHLY PLAN plan_EjFHNnzJXE3jul
    stripe.redirectToCheckout({
      items: [{ plan: this.LIVE_PLAN_X_MONTH_PLAN_CODE, quantity: that.operatorNo }],

      clientReferenceId: that.currentUserID + '|' + that.projectId,
      customerEmail: that.currentUserEmail,

      // successUrl: 'https://your-website.com/success',
      // cancelUrl: 'https://your-website.com/canceled',

      successUrl: this.dshbrdBaseUrl + '/#/project/' + this.projectId + '/success',
      cancelUrl: this.dshbrdBaseUrl + '/#/project/' + this.projectId + '/canceled',


    }).then(function (result) {
      this.logger.log('[PRICING] - clicked on stripeProPlanPerMonthCheckout (LIVE) result', result);

      if (result.error) {
        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer.
        that.displayStipeCheckoutError = result.error.message;

      }
    });
  }


  /**
   **! *** *** *** *** *** *** *** *** *** * !*
   **!         PRO PLAN X YEAR - LIVE        !*
   **! *** *** *** *** *** *** *** *** *** * !*
   */
  stripeProPlanPerYearCheckout() {
    const that = this;
    // const stripe = Stripe('pk_test_lurAeBj5B7n7JGvE1zIPIFwV');
    const stripe = Stripe(this.STRIPE_LIVE_PK);

    // When the customer clicks on the button, redirect
    // them to Checkout.
    // ID OF THE TEST yearly PLAN plan_FHYWzhwbGermkq
    stripe.redirectToCheckout({
      items: [{ plan: this.LIVE_PLAN_X_YEAR_PLAN_CODE, quantity: that.operatorNo }],
      clientReferenceId: that.currentUserID + '|' + that.projectId,
      customerEmail: that.currentUserEmail,

      // Do not rely on the redirect to the successUrl for fulfilling
      // purchases, customers may not always reach the success_url after
      // a successful payment.
      // Instead use one of the strategies described in
      // https://stripe.com/docs/payments/checkout/fulfillment
      successUrl: this.dshbrdBaseUrl + '/#/project/' + this.projectId + '/success',
      cancelUrl: this.dshbrdBaseUrl + '/#/project/' + this.projectId + '/canceled',
    })
      .then(function (result) {
        this.logger.log('[PRICING] - clicked on stripeProPlanPerYearCheckout (LIVE) result', result);
        if (result.error) {
          // If `redirectToCheckout` fails due to a browser or network
          // error, display the localized error message to your customer.

          // var displayError = document.getElementById('error-message');
          // displayError.textContent = result.error.message;

          that.displayStipeCheckoutError = result.error.message;
        }
      });
  }

  /**
  **! *** *** *** *** *** *** *** *** *** *** *** !*
  **!     LIVE PLAN 0,20 €/giorno MIN 3 QTY       !*
  **! *** *** *** *** *** *** *** *** *** *** *** !*
  */
  stripeLiveProDailyCheckout() {
    const that = this;
    const stripe = Stripe(this.STRIPE_LIVE_PK);

    // When the customer clicks on the button, redirect
    // them to Checkout.
    stripe.redirectToCheckout({
      items: [{ plan: this.LIVE_PLAN_X_DAY_20CENTS_PLAN_CODE, quantity: that.operatorNo }],
      clientReferenceId: that.currentUserID + '|' + that.projectId,
      customerEmail: that.currentUserEmail,

      // Do not rely on the redirect to the successUrl for fulfilling
      // purchases, customers may not always reach the success_url after
      // a successful payment.
      // Instead use one of the strategies described in
      // https://stripe.com/docs/payments/checkout/fulfillment
      successUrl: this.dshbrdBaseUrl + '/#/project/' + this.projectId + '/success',
      cancelUrl: this.dshbrdBaseUrl + '/#/project/' + this.projectId + '/canceled',
    })
      .then(function (result) {
        if (result.error) {
          // If `redirectToCheckout` fails due to a browser or network
          // error, display the localized error message to your customer.

          // var displayError = document.getElementById('error-message');
          // displayError.textContent = result.error.message;
          that.displayStipeCheckoutError = result.error.message;
        }
      });
  }


  /**
  **! *** *** *** *** *** *** *** *** !*
  **!  TEST DAILY PLAN €3.00 EUR/day  !*
  **! *** *** *** *** *** *** *** *** !*
  */
  stripeProPlanPerDayCheckout() {
    const that = this;
    const stripe = Stripe('pk_test_lurAeBj5B7n7JGvE1zIPIFwV');

    // When the customer clicks on the button, redirect
    // them to Checkout.
    stripe.redirectToCheckout({
      items: [{ plan: 'plan_FiYA1sAElF2aNp', quantity: that.operatorNo }],
      clientReferenceId: that.currentUserID + '|' + that.projectId,
      customerEmail: that.currentUserEmail,

      // Do not rely on the redirect to the successUrl for fulfilling
      // purchases, customers may not always reach the success_url after
      // a successful payment.
      // Instead use one of the strategies described in
      // https://stripe.com/docs/payments/checkout/fulfillment
      successUrl: this.dshbrdBaseUrl + '/#/project/' + this.projectId + '/success',
      cancelUrl: this.dshbrdBaseUrl + '/#/project/' + this.projectId + '/canceled',
    })
      .then(function (result) {
        if (result.error) {
          // If `redirectToCheckout` fails due to a browser or network
          // error, display the localized error message to your customer.

          // var displayError = document.getElementById('error-message');
          // displayError.textContent = result.error.message;
          that.displayStipeCheckoutError = result.error.message;
        }
      });
  }


  /**
 **! *** *** *** *** *** *** *** *** *** *** *** !*
 **!  TEST DAILY WITH TRIAL PLAN €10.00 EUR/day  !*
 **! *** *** *** *** *** *** *** *** *** *** *** !*
 */
  stripeProPlanPerDayWithTrialCheckout() {
    const that = this;
    const stripe = Stripe('pk_test_lurAeBj5B7n7JGvE1zIPIFwV');

    // When the customer clicks on the button, redirect
    // them to Checkout.
    stripe.redirectToCheckout({
      items: [{ plan: 'plan_Fn0Jy1ecmNXAjK', quantity: that.operatorNo }],
      clientReferenceId: that.currentUserID + '|' + that.projectId,
      customerEmail: that.currentUserEmail,

      // Do not rely on the redirect to the successUrl for fulfilling
      // purchases, customers may not always reach the success_url after
      // a successful payment.
      // Instead use one of the strategies described in
      // https://stripe.com/docs/payments/checkout/fulfillment
      successUrl: this.dshbrdBaseUrl + '/#/project/' + this.projectId + '/success',
      cancelUrl: this.dshbrdBaseUrl + '/#/project/' + this.projectId + '/canceled',
    })
      .then(function (result) {
        if (result.error) {
          // If `redirectToCheckout` fails due to a browser or network
          // error, display the localized error message to your customer.

          // var displayError = document.getElementById('error-message');
          // displayError.textContent = result.error.message;
          that.displayStipeCheckoutError = result.error.message;
        }
      });
  }








  launchWidget() {
    // if (window && window['tiledesk']) {
    //   window['tiledesk'].open();
    // }

    // <a onClick="javascript:window.open('mailto:mail@domain.com', 'mail');event.preventDefault()" href="mailto:mail@domain.com">Send a e-mail</a>

    // const mailTo = "mailto:info@tiledesk.com";
    // window.location.href = mailTo;
    // window.open('mailto:{{contactUsEmail}}', 'mail')
    window.open('mailto:sales@tiledesk.com?subject=Upgrade Tiledesk plan');

  }

  openReportPaymentModal() {
    this.displayPaymentReport = 'block'
  }

  closePaymentReportModal() {
    this.displayPaymentReport = 'none'
  }

  // -------------------------------------------------------------
  // Used for test (uncomment the button in the template to use it) 
  // -------------------------------------------------------------
  cancelSubcription() {
    this.projectService.cancelSubscription().subscribe((confirmation: any) => {
      this.logger.log('[PRICING] - cancelSubscription RES ', confirmation);

    }, error => {
      this.logger.error('[PRICING] - cancelSubscription - ERROR: ', error);
    }, () => {
      this.logger.log('[PRICING] - cancelSubscription * COMPLETE *')
    });

  }








}
