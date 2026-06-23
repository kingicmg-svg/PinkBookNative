import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';

const TABS = ['Terms of Service', 'Privacy Policy'];

const TERMS = `Last Updated: May 6, 2026

 

 
 

1. AGREEMENT TO TERMS

 
These Terms of Use and Service Agreement ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and Pinkbook ("Pinkbook," "Platform," "we," "us," or "our") governing your access to and use of the Pinkbook platform, including any associated websites, applications, features, content, and services (collectively, the "Services").

 
By accessing or using the Services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must not use the Services.

 

 

 
 

2. DESCRIPTION OF SERVICES

 
Pinkbook is a digital booking and scheduling platform designed to facilitate interactions between service providers (such as stylists) and their clients. The Platform provides tools for scheduling, service management, client data storage, availability control, payment facilitation, and workflow organization.

 
Pinkbook does not provide services directly. All services listed on the Platform are independently offered and fulfilled by third-party service providers.

 

 

 
 

3. ELIGIBILITY

 
To use the Services, you must:

 
 
• Be at least the age of majority in your jurisdiction or have parental/guardian consent
 
• Have the legal capacity to enter into binding agreements
 
• Provide accurate and complete account information
 
• Comply with all applicable laws and regulations
 
 
We reserve the right to deny access at our discretion.

 

 

 
 

4. USER ACCOUNTS

 
To access certain features, you must create an account.

 
You agree to:

 
 
• Provide accurate, current, and complete information
 
• Maintain the confidentiality of your login credentials
 
• Accept responsibility for all activity under your account
 
• Notify us immediately of any unauthorized use
 
 

 

 
 

5. PLATFORM ROLES

 

5.1 Service Providers (Stylists)

 
Service providers are responsible for:

 
 
• Defining and managing services, pricing, durations, and deposits
 
• Setting availability and scheduling rules
 
• Establishing cancellation, late, and no-show policies
 
• Delivering services to clients
 
 

5.2 Clients

 
Clients are responsible for:

 
 
• Providing accurate personal and payment information
 
• Booking and attending appointments responsibly
 
• Complying with service provider policies
 
• Communicating changes in a timely manner
 

 

5.3 Discovery Client Account Holders

 
Consumers who create a Pinkbook Discovery client account ("Client Account Holders") agree to the following additional terms:

 
 
• Client accounts are free and intended for personal, non-commercial use only
 
• You must be at least 16 years of age to create a client account
 
• You are responsible for maintaining the confidentiality of your account credentials
 
• Account information (name, email, phone) you provide will be used to pre-fill booking forms with service providers on the Platform
 
• You may delete your client account at any time; deletion will remove your personal data subject to any legal retention obligations
 
• Pinkbook reserves the right to suspend or terminate client accounts that violate these Terms or are used fraudulently
 

 

5.4 Reviews and Ratings Conduct

 
Client Account Holders who submit reviews agree that:

 
 
• Reviews must reflect genuine, first-hand experiences with the service provider
 
• Submitting false, misleading, defamatory, harassing, or incentivised reviews is strictly prohibited
 
• Reviews must not contain personal attacks, hate speech, or private information about any individual
 
• Pinkbook reserves the right to remove any review that violates these standards, without prior notice
 
• Service providers may flag reviews for investigation; flagged reviews may be temporarily hidden pending review
 
• You retain ownership of your review content but grant Pinkbook a non-exclusive, royalty-free licence to display it on the Platform
 
 

 

 
 

6. BOOKINGS AND SCHEDULING

 
The Platform facilitates appointment scheduling based on availability, service duration, and provider-defined settings including working hours and buffer time between appointments.

 
Bookings are subject to:

 
 
• Availability of the service provider as configured in their working hours settings
 
• Confirmation requirements (including payment or deposit where applicable)
 
• Service provider cancellation, no-show, and late arrival policies
 
• Buffer time enforced between appointments as configured by the service provider
 
 
Pinkbook does not guarantee appointment availability or service outcomes. Displayed availability is determined by provider-configured settings and may not reflect real-time changes.

 

 

 
 

6A. WAITLIST

 
Service providers may enable a waitlist feature allowing clients to request notification when a preferred time becomes available. By joining a waitlist, clients consent to being contacted by the service provider via their submitted email address or phone number when availability opens.

 
Waitlist entries are managed solely by the service provider. Pinkbook does not automatically convert waitlist entries into bookings. A client's inclusion on a waitlist does not guarantee a booking or constitute a confirmed appointment.

 
Clients may request removal from a waitlist by contacting the service provider directly. Service providers are responsible for managing their waitlist data in compliance with applicable privacy law.

 

 

 
 

6B. GIFT CERTIFICATES

 
Service providers may issue gift certificates through the Platform. The following terms apply:

 
 
• Gift certificates are issued at the dollar value set by the service provider and are redeemable only toward services offered by that specific service provider through Pinkbook
 
• Gift certificates are non-transferable and have no cash redemption value unless required by applicable law
 
• Pinkbook is not responsible for lost, stolen, or fraudulently redeemed gift certificate codes; code security is the responsibility of the issuing service provider and the recipient
 
• Disputes regarding gift certificate redemption or value are between the client and the service provider; Pinkbook may assist in investigation but is not liable for resolution
 
• Gift certificates may expire in accordance with applicable provincial law; service providers are responsible for configuring and disclosing expiry terms to their clients
 
 

 

 
 

6C. CUSTOM DOMAINS

 
Eligible service providers may configure a custom domain to host their Pinkbook booking page (e.g., book.yoursalon.com). By using this feature, you agree to the following:

 
 
• You represent that you own or have the legal right to use the domain you configure
 
• You are solely responsible for maintaining your domain registration, DNS configuration, and any associated hosting or SSL costs
 
• Pinkbook will issue domain verification tokens and DKIM/SPF records to facilitate email authentication; you are responsible for adding these records to your DNS configuration correctly
 
• Pinkbook reserves the right to suspend a custom domain configuration if it is used for deceptive, illegal, or abusive purposes
 
• If your domain expires or DNS records are removed, your custom domain will stop functioning; Pinkbook is not responsible for service interruption caused by domain or DNS misconfiguration
 
• Custom domain availability is a paid-tier feature and may be subject to plan-level access restrictions
 
 

 

 
 

7. PAYMENTS AND DEPOSITS

 
Payments may be processed through third-party providers.

 
Users acknowledge:

 
 
• Deposits may be required to confirm bookings
 
• Payment methods may include credit/debit cards or alternative methods defined by the provider
 
• Pinkbook does not store full payment card details
 
• Payment processing is handled externally
 
 
Service providers determine their own pricing, deposit structures, and payment requirements.

 

 

 
 

8. CANCELLATIONS, RESCHEDULING, AND NO-SHOWS

 
Each service provider defines their own policies regarding:

 
 
• Cancellations
 
• Rescheduling
 
• Late arrivals
 
• No-shows
 
 
By booking through the Platform, clients agree to comply with these policies. Penalties, fees, or forfeitures may apply in accordance with provider rules.

 

 

 
 

9. USER DATA AND CONTENT

 
Users may submit personal data, booking details, and other content.

 
You retain ownership of your data but grant Pinkbook a limited license to store, process, display, and transmit such data solely for operating and improving the Services.

 
You are responsible for ensuring the legality and accuracy of any data you provide.

 

 

 
 

9A. SERVICE PROVIDER DATA CONTROLLER RESPONSIBILITIES

 
When a service provider stores client records (names, contact information, booking notes, and related data) within Pinkbook, the service provider acts as the data controller for that client data. Pinkbook acts as a data processor on the service provider's behalf.

 
Service providers are solely responsible for:

 
 
• Obtaining any necessary consent from their clients before collecting and storing personal data through the Platform
 
• Complying with applicable privacy laws (including PIPEDA and applicable provincial legislation) in relation to their clients' data
 
• Responding to data access, correction, and deletion requests made by their own clients
 
• Ensuring that client contact information used for automated reminders and communications is accurate and consented to
 
• Maintaining appropriate data retention and deletion practices for their client records
 
 
Pinkbook will not use client data entered by service providers for any purpose other than operating the Platform for that service provider's account. Pinkbook will assist service providers in fulfilling verifiable deletion requests from their clients upon confirmation.

 

 

 
 

10. PRIVACY

 
Your use of the Services is subject to our data handling practices. By using the Platform, you consent to the collection and use of your information as necessary to operate the Services.

 
We implement reasonable safeguards but do not guarantee absolute security.

 

 

 
 

10A. DATA SECURITY AND DATA BREACH

 
Pinkbook implements reasonable administrative, technical, and organizational safeguards designed to protect user data, including encryption of sensitive information at rest and secure transmission protocols.

 
However, no system can guarantee absolute security.

 
In the event of a data breach or suspected unauthorized access involving user data, Pinkbook may take appropriate actions which may include:

 
 
• Investigating and containing the incident
 
• Notifying affected users where required by applicable law
 
• Coordinating with third-party security providers and authorities
 
• Implementing remedial security measures to mitigate risk
 
 
By using the Services, you acknowledge and agree that:

 
 
• Pinkbook does not guarantee that user data will never be compromised
 
• Encryption and security measures reduce risk but do not eliminate it
 
• You are responsible for maintaining the confidentiality of your account credentials
 
• Pinkbook shall not be liable for losses arising from unauthorized access, data breaches, or security incidents beyond its reasonable control, except as required by applicable law
 
 
Users agree to promptly notify Pinkbook if they suspect any unauthorized access to their account or data.

 

 

 
 

11. PROHIBITED ACTIVITIES

 
You agree not to:

 
 
• Use the Platform for unlawful purposes
 
• Interfere with system functionality or security
 
• Attempt unauthorized access to accounts or systems
 
• Misrepresent identity or information
 
• Exploit, reverse engineer, or copy the Platform without authorization
 
• Engage in fraudulent or abusive activity
 
 
Violations may result in suspension or termination.

 

 

 
 

12. THIRD-PARTY SERVICES

 
The Platform integrates with third-party service providers to deliver core functionality. By using the Platform, you acknowledge and agree that your data may be transmitted to and processed by these providers as necessary to operate the Services.

 
Stripe — Payment processing and Stripe Connect for service provider payouts. Stripe independently processes payment card data. You are subject to Stripe's Terms of Service.

 
Twilio — SMS appointment reminders, routed through the service provider's own connected Twilio account. Service providers are responsible for their Twilio account credentials and compliance with applicable messaging regulations (including TCPA, CASL, and similar laws).

 
Anthropic (Claude AI) — AI Brain features. When AI Brain is enabled, pseudonymized behavioral data may be processed through Anthropic's API. See Section 12A.

 
Email Delivery Provider — Transactional emails (confirmations, reminders, password resets) are delivered through a configured email delivery provider (such as SendGrid) or via a custom domain SMTP configuration. Email delivery is subject to that provider's terms.

 
Render — Cloud infrastructure provider hosting the Platform's backend and database.

 
Pinkbook is not responsible for:

 
 
• Third-party service availability or performance
 
• Third-party data handling practices (governed by their respective privacy policies and terms)
 
• Errors, outages, or failures originating from third-party systems
 
• Third-party fee changes or billing policies
 
 

 

 
 

12A. AI FEATURES AND AUTOMATED PROCESSING

 
Pinkbook offers an optional AI Brain feature powered by Anthropic's Claude AI. This feature is controlled by the service provider and can be enabled or disabled at any time in account Settings.

 

12A.1 What the AI Brain Does

 
When enabled, the AI Brain analyzes booking history and anonymized behavioral signals to generate structured business recommendations for the service provider, such as client re-engagement prompts, service preference insights, and scheduling optimizations. Computed signals and recommendations are stored in the service provider's account.

 

12A.2 Data Sent to Anthropic

 
Only pseudonymized and aggregated data is transmitted to Anthropic's API — hashed client identifiers and aggregated booking statistics. Raw personal data (names, email addresses, phone numbers) is never sent to Anthropic for AI processing.

 

12A.3 No Guarantees on AI Output

 
AI-generated recommendations are provided for informational purposes only. Pinkbook makes no representations or warranties regarding the accuracy, completeness, or fitness for purpose of any AI-generated content. Service providers are solely responsible for any actions taken based on AI recommendations. AI outputs do not constitute professional business, legal, or financial advice.

 

12A.4 Client Awareness

 
Service providers who enable AI Brain are responsible for ensuring their use of AI-assisted analysis of client data complies with applicable privacy law, including any notification or consent requirements that may apply in their jurisdiction.

 

 

 
 

13. DISCLAIMERS

 
The Services are provided "as is" and "as available" without warranties of any kind.

 
Pinkbook does not guarantee:

 
 
• Uninterrupted or error-free operation
 
• Accuracy or reliability of user-generated content
 
• Outcomes of services provided by third-party users
 
 

 

 
 

14. LIMITATION OF LIABILITY

 
To the maximum extent permitted by law:

 
 
• Pinkbook shall not be liable for indirect, incidental, or consequential damages
 
• Pinkbook shall not be liable for disputes between users
 
• Pinkbook shall not be liable for service delivery outcomes
 
 
Your sole remedy is to discontinue use of the Services.

 

 

 
 

15. INDEMNIFICATION

 
You agree to indemnify and hold harmless Pinkbook and its affiliates from any claims arising out of:

 
 
• Your use of the Services
 
• Your violation of these Terms
 
• Your violation of applicable laws or third-party rights
 
 

 

 
 

16. TERMINATION

 
We may suspend or terminate your access at any time for violations of these Terms or harmful conduct.

 
You may terminate your account at any time by discontinuing use of the Services.

 

 

 
 

17. PAID SERVICES, SUBSCRIPTIONS, AND BILLING

 

17.1 Subscription Plans

 
Pinkbook offers tiered subscription plans ("Starter," "Pro," "Salon") that grant access to additional features, functionality, usage capacity, and premium support channels. Feature availability, usage limits, and pricing for each plan are detailed on the Pinkbook pricing page and may be updated from time to time. Your plan tier determines the scope of services available to you.

 

17.2 Billing and Authorization

 
By subscribing to a paid plan, you expressly authorize Pinkbook to charge, and continue to charge, your designated payment method on a recurring basis at the frequency associated with your selected billing cycle (monthly or annual). You represent and warrant that you are authorized to use the payment method provided. Pinkbook may use third-party payment processors (e.g., Stripe) to facilitate billing, and you agree to comply with their terms of service.

 

17.3 Automatic Renewal

 
All subscriptions automatically renew at the end of each billing cycle at the then-current rate unless canceled at least 24 hours before the start of the next billing cycle. You acknowledge and agree that renewal charges are non-negotiable once processed. It is your sole responsibility to monitor your billing cycle and cancel before renewal if you do not wish to be charged.

 

17.4 Cancellation

 
You may cancel your subscription at any time through your account settings or by contacting support.

 
Upon cancellation:

 
 
• Your access to paid features will continue through the end of the current billing period you have already paid for
 
• No further charges will be applied after the current billing cycle ends
 
• Your account will revert to the free tier (Starter) at the end of the paid period
 
• Any data, configurations, or features exclusive to your paid tier may become inaccessible upon downgrade
 
• Pinkbook is not obligated to retain tier-specific data beyond 90 days after downgrade
 

 

17.5 Refunds and Pro-Rated Refund Policy

 
Refunds are only applicable under the following conditions:

 
 
• The user has not created, completed, or received any bookings during the current billing period, AND
 
• The user has not utilized any paid-tier features (including but not limited to: email/SMS notifications, custom domains, advanced reporting, API integrations) during the current billing period, AND
 
• The user submits a refund request within 14 days of the charge
 
 
Where eligible, Pinkbook may issue a pro-rated refund for the unused portion of the current billing cycle, calculated from the date the refund request is approved.

 
No refunds will be issued if:

 
 
• Any bookings, services, or platform usage have occurred during the billing period
 
• The account remains active and has utilized any paid features
 
• The refund request is submitted more than 14 days after the charge
 
• The account was terminated due to a Terms of Use violation
 
• The request falls outside the eligibility conditions stated above
 
 
All refund requests are subject to verification and final approval at Pinkbook's sole discretion, consistent with this policy and applicable consumer protection law. Refunds are processed to the original payment method within 5–10 business days of approval.

 

17.6 Price Changes

 
Pinkbook reserves the right to modify subscription pricing at any time. You will be notified of any price changes at least 30 days before they take effect, via email or in-app notification. Continued use of paid services after the effective date of a price change constitutes your acceptance of the new pricing. If you do not agree, you must cancel your subscription before the next billing cycle.

 

17.7 Non-Payment and Payment Failures

 
If a payment fails or is declined, Pinkbook may:

 
 
• Retry the charge up to 3 times over a 10-day grace period
 
• Suspend access to paid features during the grace period
 
• Downgrade your account to the free tier if payment is not resolved within the grace period
 
• Terminate the account if non-payment persists beyond 30 days
 
 
You remain liable for all accrued charges during any period of non-payment. Pinkbook reserves the right to engage collection services or report delinquent accounts.

 

17.8 Taxes

 
All subscription fees are exclusive of applicable taxes (including but not limited to GST, HST, VAT, or sales tax) unless otherwise stated. You are solely responsible for determining and remitting any taxes, duties, or government assessments associated with your use of paid services. Pinkbook will collect applicable taxes where legally required to do so.

 

17.9 Fair Use Policy

 
Paid plans include generous usage allowances. However, Pinkbook reserves the right to monitor usage and enforce fair use limits to prevent abuse, system degradation, or resource exhaustion. Excessive automated activity, bulk data operations, or usage patterns inconsistent with normal business use may result in throttling, feature restriction, or account review. Pinkbook will provide reasonable notice before taking enforcement action, except in cases of urgent system protection.

 

17.10 Service Credits and Compensation

 
In the event of a Pinkbook service outage exceeding 24 consecutive hours that materially impacts your ability to use paid features, you may request a service credit. Service credits are calculated as a pro-rated amount based on the duration of the outage and are applied to future billing cycles. Service credits do not apply to outages caused by scheduled maintenance, force majeure events, or third-party service disruptions.

 

 

 
 

18. MODIFICATIONS TO TERMS

 
Pinkbook reserves the right to modify, amend, or replace these Terms at any time. When we make material changes, we will:

 
 
• Update the "Last Updated" date at the top of this document
 
• Provide notice via email to your registered account address and/or a prominent in-app notification at least 14 days before material changes take effect
 
• Clearly describe the nature of the changes in the notification
 
 
Your continued use of the Platform after the effective date of any modifications constitutes your binding acceptance of the updated Terms. If you do not agree with any changes, you must immediately discontinue use and, if applicable, cancel your subscription. It is your responsibility to review these Terms periodically.

 

 

 
 

19. GOVERNING LAW AND JURISDICTION

 
These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario, Canada, without regard to conflict of law principles. Any legal proceedings arising from or related to these Terms or your use of the Platform shall be brought exclusively in the courts of competent jurisdiction located in Toronto, Ontario, Canada, and you irrevocably consent to the personal jurisdiction of such courts.

 
Notwithstanding the foregoing, Pinkbook retains the right to seek injunctive or other equitable relief in any jurisdiction to protect its intellectual property rights or confidential information.

 

 

 
 

20. DISPUTE RESOLUTION

 
Before initiating any formal legal proceedings, you agree to first attempt to resolve any dispute arising from these Terms or your use of the Platform through the following process:

 
 
• Informal Resolution: Contact Pinkbook at the email address listed in Section 27. We will make a good-faith effort to resolve your concern within 30 business days.
 
• Mediation: If informal resolution fails, either party may initiate non-binding mediation administered by a mutually agreed-upon mediator. Each party bears its own mediation costs.
 
• Binding Arbitration: If mediation fails, the dispute shall be settled by binding arbitration in accordance with the rules of the ADR Institute of Canada, conducted in Toronto, Ontario. The arbitrator's decision shall be final and enforceable in any court of competent jurisdiction.
 
 
Class Action Waiver: You agree that any dispute resolution proceedings will be conducted only on an individual basis and not as part of a class, consolidated, or representative action. You waive any right to participate in class action lawsuits or class-wide arbitration against Pinkbook.

 
Small Claims Exception: Either party may bring an individual action in small claims court for disputes within the court's jurisdictional limits.

 

 

 
 

21. SEVERABILITY

 
If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect. The invalid or unenforceable provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving the original intent of the parties, or if modification is not possible, it shall be severed from these Terms.

 

 

 
 

22. ENTIRE AGREEMENT

 
These Terms, together with our Privacy Policy, any applicable subscription agreement, and any additional terms referenced herein, constitute the entire agreement between you and Pinkbook regarding your use of the Platform and Services. These Terms supersede all prior negotiations, representations, warranties, commitments, and communications (whether written or oral) between you and Pinkbook relating to the subject matter hereof.

 
No waiver of any provision of these Terms shall be effective unless in writing and signed by Pinkbook. The failure by Pinkbook to exercise or enforce any right or provision of these Terms shall not operate as a waiver of such right or provision.

 

 

 
 

23. INTELLECTUAL PROPERTY

 
All content, features, functionality, trademarks, service marks, logos, designs, text, graphics, software, and other intellectual property displayed on or through the Platform are the exclusive property of Pinkbook or its licensors and are protected by applicable intellectual property laws.

 
 
• You may not copy, reproduce, distribute, modify, create derivative works from, publicly display, or commercially exploit any Platform content without prior written consent from Pinkbook
 
• The "Pinkbook" name, logo, and all related names, logos, and slogans are trademarks of Pinkbook and may not be used without express written permission
 
• Any feedback, suggestions, or ideas you submit to Pinkbook become the sole property of Pinkbook, and you assign all rights therein to Pinkbook without compensation
 
 

 

 
 

24. FORCE MAJEURE

 
Pinkbook shall not be liable for any failure or delay in performing its obligations under these Terms if such failure or delay results from circumstances beyond its reasonable control, including but not limited to: natural disasters, pandemics, government actions, war, terrorism, labor disputes, power failures, internet or telecommunications failures, cyberattacks, or third-party service provider outages. During any force majeure event, Pinkbook's obligations are suspended for the duration of the event.

 

 

 
 

25. ASSIGNMENT

 
You may not assign, transfer, or delegate your rights or obligations under these Terms without prior written consent from Pinkbook. Pinkbook may freely assign these Terms and its rights and obligations hereunder in connection with a merger, acquisition, corporate reorganization, or sale of all or substantially all of its assets, without your consent or notice. Subject to the foregoing, these Terms bind and inure to the benefit of the parties and their respective successors and permitted assigns.

 

 

 
 

26. ELECTRONIC COMMUNICATIONS CONSENT

 
By creating an account or using the Platform, you consent to receive electronic communications from Pinkbook, including but not limited to: account notifications, booking confirmations, billing receipts, service updates, marketing communications (where you have opted in), and legal notices. You agree that all agreements, notices, disclosures, and other communications we provide to you electronically satisfy any legal requirement that such communications be in writing. You may opt out of marketing communications at any time, but transactional and legal communications are mandatory while your account remains active.

 

 

 
 

27. CONTACT

 
For questions, concerns, or legal notices regarding these Terms, please contact:

 
 Pinkbook Legal

 pinkbook.tech@gmail.com

 

 Response time: within 5 business days for general inquiries, within 2 business days for legal or billing matters.`;

const PRIVACY = `Effective Date: April 23, 2026 · Last Updated: May 6, 2026
 
This Privacy Policy applies to all Pinkbook services — the booking platform, owner dashboard, client-facing booking pages, and associated features. It describes what personal information we collect, how we use and protect it, who we share it with, and what rights you have. We are committed to transparency and to handling information responsibly.

 

 
 
 

1. Who We Are

 
Pinkbook is a digital booking and business management platform built for beauty and wellness service providers — stylists, estheticians, nail technicians, and similar professionals — and the clients who book their services. Pinkbook can be reached at pinkbook.tech@gmail.com for all privacy-related inquiries.

 
Pinkbook operates in two distinct data roles depending on context:

 
 
• Data Controller: Pinkbook determines how and why account registration data, platform usage data, billing data, and operational data are processed.
 
• Data Processor: When a service provider stores client records (names, contact details, booking notes) in Pinkbook, Pinkbook acts as a processor on behalf of the service provider. The service provider is the data controller for their clients' information. Clients of a service provider should direct data access or deletion requests to their service provider first.
 
 

 
 
 

2. Who This Policy Covers

 
 
• Service Providers (Account Owners): Individuals or businesses who create a Pinkbook account to manage bookings, clients, services, payments, and business settings.
 
• Clients (End Consumers): Individuals who book appointments through a service provider's Pinkbook page, join a waitlist, or otherwise submit personal information through the platform.
 
• Visitors: Anyone who views a Pinkbook-hosted page (landing page, public booking page, help center) without creating an account.
 
 

 
 
 

3. Information We Collect

 

3.1 Account Registration (Service Providers)

 
When a service provider creates an account, we collect:

 
 
• Full name — stored encrypted at rest
 
• Email address — stored encrypted and as a one-way cryptographic hash for lookup purposes
 
• Phone number (optional) — stored encrypted and hashed
 
• Password — stored as a salted cryptographic hash; plaintext is never retained
 
• Business name, logo URL, and display preferences
 
• Email verification status and account timestamps
 

 

3.2 Business Settings

 
Service providers configure their account through the Settings page. This configuration is stored in their account record and includes:

 
 
• Working hours per day of week and buffer time between appointments
 
• Appointment reminder lead time preference
 
• Service catalogue: service names, durations, prices, and deposit requirements
 
• Cancellation, late arrival, and no-show policy text
 
• Third-party integration credentials:
 
 
• Twilio account SID, auth token, and phone number (for opt-in SMS reminders)
 
• Stripe Connect account details (for payment collection)
 
 
 
• Custom domain configuration (if enabled)
 
• Calendar preferences and blocked time configurations
 
 
 
Third-party credentials security: Twilio credentials entered in Settings are stored encrypted in your account record. Pinkbook never exposes them client-side. You are responsible for rotating these credentials if you suspect compromise. Pinkbook is not liable for losses arising from credential exposure by the account holder.

 

 

3.3 Client Records (Stored by Service Providers)

 
Service providers manage their client list within Pinkbook. Each client record may contain:

 
 
• Client name — encrypted at rest
 
• Contact email address — encrypted at rest and hashed for lookups
 
• Contact phone number (optional) — encrypted at rest and hashed
 
• Private notes — encrypted at rest
 
 
Pinkbook stores this data on behalf of the service provider and does not use it for any purpose beyond operating the platform for that provider.

 

3.4 Booking Records

 
When a client books an appointment, a booking record is created containing:

 
 
• Client name and contact details provided at booking time
 
• Service name, scheduled start and end time
 
• Booking status (pending, confirmed, completed, cancelled, no-show)
 
• Deposit expiry timestamp (for e-transfer payment bookings)
 
• Stripe session ID and payment intent ID (reference identifiers only — no card data stored)
 
• Appointment notes provided by the client — encrypted at rest
 
• A single-use management token used to identify the booking for self-serve cancellation or rescheduling
 
• Reminder dispatch timestamp (when an automated reminder was sent)
 

 

3.5 Waitlist Entries

 
If a service provider uses the waitlist feature, clients who join provide their name, email address, optional phone number, preferred service, preferred date, and an optional message. This data is retained until the service provider removes it, notifies the client, or closes their account.

 

3.6 Gift Certificates

 
When a gift certificate is created or redeemed through the platform, we store the certificate code, monetary value, creation date, redemption status, redemption timestamp, and the email address of the redeemer (if provided).

 

3.7 Payment Information

 
Pinkbook does not store full payment card details. All payment card processing is handled by Stripe. We retain Stripe session IDs and payment intent IDs as reference identifiers, and store Stripe Connect account linkage details (account ID, payout eligibility flags) to enable service provider payment features. Review Stripe's Privacy Policy for how Stripe independently processes payment data.

 

3.8 Communications and Email Logs

 
Pinkbook sends automated emails (booking confirmations, appointment reminders, password resets, email verifications) on behalf of service providers and directly for account operations. We maintain an operational email log that records:

 
 
• Masked recipient address (e.g., j***@gmail.com) and domain only — full email addresses are never stored in the log
 
• A one-way hash of the recipient email, used for lookups without storing plaintext
 
• Email subject line and template type
 
• Delivery status, provider used, and timestamp
 
 
SMS appointment reminders are routed through the service provider's own Twilio account. Pinkbook does not retain SMS message content after dispatch.

 

3.9 Interaction and Behavioral Data

 
The booking flow records anonymized interaction events (e.g., calendar viewed, time slot selected, booking submitted) to help service providers understand how clients engage with their booking page. These events are linked to a one-way hash of the client's email address — not to their name or identity directly. This data is used to power the AI Brain feature (see Section 7).

 

3.10 Audit Logs and Technical Data

 
For security and compliance, Pinkbook maintains append-only audit logs of actions taken by authenticated users. These logs capture the action type (e.g., booking created, settings updated), the IP address of the request, a timestamp, and a reference to the affected record. IP addresses are retained for security investigation purposes only and are not used for advertising or profiling.

 

3.11 Browser Local Storage

 
Pinkbook uses browser localStorage to persist certain state locally on your device — including authentication tokens, calendar view preferences, working hours drafts, and UI settings. This data is stored on your device and is not transmitted to servers unless explicitly synced. Clearing browser storage will reset locally stored preferences.

 

3.12 Discovery Client Accounts

 
Consumers who create a Pinkbook Discovery client account provide:

 
 
• First and last name
 
• Email address — stored encrypted and as a one-way hash
 
• Phone number (optional) — stored encrypted
 
• Password — stored as a salted cryptographic hash; plaintext is never retained
 
• Email verification status and account timestamps
 
• Google account identifier (google_id) — if the account was created or linked via Google Sign-In (see 3.14)
 
 
Client account data is used to pre-fill booking forms and personalise the discovery experience. It is not shared with service providers beyond the information you choose to include in a booking.

 

3.13 Reviews and Ratings

 
Verified client account holders may leave a star rating (1–5) and optional text comment on a service provider's Discovery profile. We store:

 
 
• Rating value and comment text
 
• A reference to the client account and the service provider (owner ID)
 
• Review status (approved by default), creation and update timestamps
 
 
Review authors are displayed by first name and last initial only (e.g., "Sarah T."). Reviews are visible on the service provider's public Discovery page. You may delete your review at any time from your client account.

 

3.14 Google Sign-In

 
If you choose to sign in or create a client account using Google, we receive from Google:

 
 
• Your Google account ID (a numeric identifier)
 
• Your display name and email address as registered with Google
 
 
We store your Google ID alongside your Pinkbook client account to enable future sign-in without a password. We do not receive, store, or access your Google password, contacts, calendar, or other Google account data through this process. You may disconnect Google Sign-In by deleting your Pinkbook client account or contacting us at pinkbook.tech@gmail.com.

 

 
 
 

4. How We Use Your Information

 
We use the information we collect to:

 
 
• Create and maintain your account, authenticate sessions, and manage access
 
• Process and manage appointment bookings, including confirmation and reminder communications
 
• Enable service providers to manage their client list, service catalogue, schedule, and settings
 
• Process subscription billing and payments via Stripe
 
• Send automated appointment reminders to clients via email and optional SMS on the service provider's behalf
 
• Facilitate waitlist management and gift certificate issuance
 
• Detect and prevent unauthorized access, fraud, and policy violations
 
• Maintain audit trails for security monitoring and incident investigation
 
• Compute AI-assisted behavioral insights for service providers through the AI Brain feature (see Section 7)
 
• Provide customer support and respond to account inquiries
 
• Comply with applicable legal obligations
 
• Improve platform reliability and performance
 
 
Pinkbook does not sell your personal information to third parties and does not use it for targeted advertising or cross-platform tracking.

 

 
 
 

5. Legal Basis for Processing

 
We process personal information under the following legal bases, consistent with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy legislation:

 
 
• Contractual necessity: Account registration, booking operations, payment processing, and communications necessary to deliver the services you have signed up for.
 
• Legitimate interests: Security monitoring, fraud prevention, audit logging, and platform improvement — where these interests are not overridden by your privacy rights.
 
• Consent: AI Brain behavioral analysis, marketing communications, and optional third-party integrations. You may withdraw consent at any time without affecting prior processing.
 
• Legal obligation: Compliance with applicable laws, court orders, or regulatory authority requirements.
 
 

 
 
 

6. Data Sharing and Third-Party Processors

 
Pinkbook shares data with the following third-party services only as strictly necessary to operate the platform:

 

 

Stripe — Payments

 
Used to process deposits and subscription billing, and to facilitate Stripe Connect accounts for service providers. When a payment is initiated, relevant transaction data (amount, booking reference) is transmitted to Stripe. Stripe independently processes payment card data. See Stripe's Privacy Policy.

 

 

Twilio — SMS Reminders

 
If a service provider has connected their own Twilio account, appointment reminders are routed through it. The client's phone number and a templated reminder message are transmitted to Twilio for delivery at the time of sending. Pinkbook uses the service provider's credentials for this; it does not maintain a shared Twilio account. See Twilio's Privacy Policy.

 

 

Anthropic (Claude AI) — AI Brain

 
When the AI Brain feature is enabled by a service provider, aggregated and pseudonymized behavioral signals (derived from hashed client identifiers and booking pattern data — not names, emails, or phone numbers) may be sent to Anthropic's API to generate business recommendations. Raw personal data is never sent to Anthropic. See Anthropic's Privacy Policy. Service providers may disable AI Brain at any time in Settings.

 

 

Email Delivery Provider — Transactional Email

 
Automated transactional emails (booking confirmations, reminders, password resets) are delivered through a configured email provider (SendGrid or a custom domain SMTP configuration). The recipient's email address and email content are transmitted to the provider for delivery. Only a masked address and hash are retained in Pinkbook's email log.

 

 

Render — Cloud Infrastructure

 
Pinkbook's backend, database, and application are hosted on Render's cloud infrastructure. All platform data resides on Render-managed servers. Render acts as a sub-processor under contractual data protection obligations. See Render's Privacy Policy.

 

 

Legal Disclosure

 
We may disclose personal information when required by applicable law, enforceable court order, or regulatory authority, or when reasonably necessary to protect the rights, safety, or property of Pinkbook or its users.

 

 
 
 

7. AI Brain Feature and Automated Processing

 
Pinkbook includes an optional AI Brain feature powered by Anthropic's Claude AI model. This feature is controlled by the service provider and can be enabled or disabled at any time in Settings.

 
When enabled, the AI Brain:

 
 
• Analyzes booking history and behavioral interaction data to identify patterns such as visit frequency, service preferences, scheduling tendencies, and no-show risk indicators
 
• Generates structured business recommendations for the service provider (e.g., re-engagement timing, service upsell opportunities, scheduling optimizations)
 
• Stores computed behavioral signals per client in the client_signals table and structured recommendations in the ai_recommendations table
 
 
Processing uses pseudonymized data only. Clients are referenced by hashed identifiers and aggregated booking statistics — not by name, email address, or direct contact details — when generating AI outputs.

 
Service providers are solely responsible for how they act on AI-generated recommendations. Pinkbook makes no guarantee of accuracy or suitability for any particular business decision.

 
 
Disabling AI Brain stops new signal computation. Previously stored signals and recommendations remain in the database until the service provider deletes the associated client records, or until account closure.

 
 

 
 
 

8. Data Security

 
We implement the following safeguards to protect your information:

 
 
• Encryption at rest: Account names, email addresses, phone numbers, client records, and booking notes are stored encrypted using application-level encryption. Hashed versions are stored separately for lookup operations.
 
• Password protection: Passwords are stored as salted cryptographic hashes. Plaintext passwords are never stored, logged, or transmitted after the point of entry.
 
• Transport security: All communications between your browser and our servers use HTTPS/TLS encryption.
 
• Token security: Management tokens, password reset tokens, and email verification tokens are single-use and time-limited. Only hashed values are stored in the database.
 
• Authentication: API access requires JWT-based authentication. Tokens are short-lived and signed with a server-held secret.
 
• Audit logging: All significant account actions are recorded with IP address and timestamp for security monitoring and incident response.
 
 
No system can guarantee absolute security. In the event of a breach affecting personal data, Pinkbook will investigate, contain, and notify affected users as required by applicable law.

 

 
 
 

9. Data Retention

 
We retain data for as long as necessary to operate the platform and meet legal obligations:

 
 
• Active account data: Retained for the life of the account, plus 90 days after account deletion to support dispute resolution and billing finalization.
 
• Booking records: Retained for up to 3 years from the booking date, then deleted or anonymized.
 
• Audit logs: Retained for 2 years.
 
• Email logs: Retained for 1 year. Full email addresses are never stored in these logs.
 
• Password reset and email verification tokens: Deleted upon use or expiry, whichever comes first.
 
• AI signals and recommendations: Retained for the duration of the account and deleted within 30 days of account closure.
 
• Waitlist entries: Retained until the service provider removes them or until account closure.
 
 
You may request deletion of your data at any time by contacting pinkbook.tech@gmail.com, subject to retention obligations we are legally required to maintain.

 

 
 
 

10. Your Privacy Rights

 
Subject to applicable law, you have the right to:

 
 
• Access: Request a copy of the personal information we hold about you.
 
• Correction: Request that inaccurate or incomplete information be corrected.
 
• Deletion: Request deletion of your personal information where we have no legal obligation to retain it.
 
• Withdraw consent: Withdraw consent for processing based on consent (e.g., AI Brain, marketing emails) at any time, without affecting the lawfulness of prior processing.
 
• Data portability: Request your data in a structured, portable format where technically feasible.
 
• Object: Object to processing based on legitimate interests where your rights override those interests.
 
 
To exercise any of these rights, contact us at pinkbook.tech@gmail.com. We will respond within 30 days. We may require identity verification before processing a request.

 
 
Clients of service providers: Your booking data is controlled by the service provider whose page you booked through. For deletion or access requests, contact that service provider directly. Pinkbook will assist with technical deletion upon confirmed request from the service provider.

 
 

 
 
 

11. Cookies and Local Storage

 
Pinkbook does not use tracking cookies, advertising cookies, or third-party analytics scripts. The platform uses browser localStorage to store your authentication token, calendar view preferences, working hours settings, and UI state between sessions on the same device. This data is kept on your device, is never shared with third parties, and is not used for tracking or profiling. Clearing your browser's storage will reset all locally stored preferences.

 

 
 
 

12. Children's Privacy

 
Pinkbook is not directed at individuals under the age of majority in their jurisdiction (18 in most Canadian provinces). We do not knowingly collect personal information from minors. If you believe a minor has submitted information through the platform, contact us at pinkbook.tech@gmail.com and we will promptly delete it.

 

 
 
 

13. Data Location and International Transfers

 
Pinkbook's infrastructure is hosted by Render. Data may be processed and stored on servers in Canada or the United States depending on Render's infrastructure configuration. When data is transferred internationally — for example, through Stripe, Twilio, Anthropic, or hosting infrastructure — we rely on standard contractual protections and the respective data processing agreements of those providers.

 
By using Pinkbook, you acknowledge that your information may be transferred to and processed in jurisdictions outside your own. We take reasonable steps to ensure these transfers comply with applicable privacy law.

 

 
 
 

14. Changes to This Privacy Policy

 
We may update this Privacy Policy from time to time. For material changes, we will notify affected users via email (to the registered account address) and/or via a prominent in-app notice at least 14 days before the change takes effect. The "Last Updated" date at the top of this page reflects the most recent revision. Continued use of the platform after the effective date constitutes acceptance of the updated policy.

 

 
 
 

15. Contact and Privacy Inquiries

 
For privacy questions, access requests, deletion requests, or to report a concern regarding your data:

 
 Pinkbook Privacy

 pinkbook.tech@gmail.com

 Response time: within 10 business days for general inquiries · within 30 days for formal access or deletion requests.
 
 
If your privacy concern has not been adequately resolved, you may contact the Office of the Privacy Commissioner of Canada at www.priv.gc.ca.`;

export default function PoliciesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState(0);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Legal</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={s.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={i} style={[s.tab, tab === i && s.tabActive]} onPress={() => setTab(i)}>
            <Text style={[s.tabTxt, tab === i && s.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.body}>{tab === 0 ? TERMS : PRIVACY}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.cream },
  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:       { color: Colors.rose, fontWeight: '700', fontSize: 14, width: 60 },
  title:      { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  tabs:       { flexDirection: 'row', backgroundColor: Colors.pinkLight + '60', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab:        { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:  { borderBottomWidth: 2, borderBottomColor: Colors.rose },
  tabTxt:     { fontSize: 13, fontWeight: '600', color: Colors.soft },
  tabTxtActive:{ color: Colors.rose, fontWeight: '800' },
  scroll:     { padding: 20 },
  body:       { fontSize: 13, color: Colors.mid, lineHeight: 22 },
});