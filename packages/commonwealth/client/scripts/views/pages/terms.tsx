import { useCommonNavigate } from 'navigation/helpers';
/* eslint-disable max-len */
import React from 'react';
import { CWText } from '../components/component_kit/cw_text';
import './privacy_and_terms.scss';

const TOS = `
Please read this Terms of Use Agreement (the "**Terms of Use**") carefully. This Website and any related websites or subdomains that link to these Terms of Use and are operated by Cow Moon Wealth Software, Inc. (**Common**, **we**, **us**, or **our**), its affiliates or agents (collectively, the **Website**) and the information on the Website are owned and controlled by Common. The Terms of Use governs the use of the Website and applies to all users visiting the Website or using the services enabled through the Website in any way, including using the Software (defined below) licensed by Common to create and join communities and interact with other users and using the Website and the services enabled thereby (each including the Website, a **Service** and, collectively, the **Services**) to manage your use of the Software.
BY USING ANY SERVICES, CREATING AN ACCOUNT, CONNECTING A DIGITAL WALLET TO THE WEBSITE, AND/OR BROWSING THE WEBSITE, YOU REPRESENT THAT (1) YOU HAVE READ, UNDERSTAND, AND AGREE TO BE BOUND BY THE AGREEMENT, (2) YOU ARE OF LEGAL AGE TO FORM A BINDING CONTRACT WITH COMMON, (3) YOU HAVE THE AUTHORITY TO ENTER INTO THE TERMS OF USE PERSONALLY OR ON BEHALF OF THE ENTITY (WHETHER OR NOT SUCH ENTITY IS REGISTERED OR INCORPORATED UNDER THE LAWS OF ANY JURISDICTION) YOU HAVE NAMED AS THE USER, AND TO BIND THAT ENTITY TO THE TERMS OF USE; AND (4) YOU UNDERSTAND AND AGREE THAT YOU ARE SOLELY RESPONSIBLE FOR ENSURING THAT YOUR USE OF THE SERVICES COMPLIES WITH THE LAWS OF YOUR JURISDICTION. THE TERM "YOU" REFERS TO THE INDIVIDUAL OR ENTITY, AS APPLICABLE, IDENTIFIED AS THE USER WHEN YOU REGISTERED ON THE WEBSITE. **IF YOU DO NOT AGREE TO BE BOUND BY THE TERMS OF USE, YOU MAY NOT ACCESS OR USE THIS WEBSITE OR THE SERVICES.**
**COMMON IS NOT AN EXCHANGE, TRUST COMPANY, LICENSED BROKER, DEALER, BROKER-DEALER, INVESTMENT ADVISOR, INVESTMENT MANAGER, OR ADVISER. NEITHER COMMON NOR OUR SERVICES GIVE, OFFER, OR RENDER INVESTMENT, TAX, OR LEGAL ADVICE. COMMON PROVIDES SOFTWARE THAT ALLOWS YOU TO MANAGE YOUR SELF-CUSTODIED SOFTWARE WALLETS AND OTHERWISE WRITE TRANSACTIONS THAT MAY BE EXECUTED ON THIRD-PARTY BLOCKCHAINS AND OTHER THIRD-PARTY SERVICES (DEFINED BELOW) AND RELATED ADMINISTRATIVE SERVICES. BEFORE MAKING LEGAL, FINANCIAL, OR INVESTMENT DECISIONS, WE RECOMMEND THAT YOU CONTACT AN INVESTMENT ADVISOR, OR TAX OR LEGAL PROFESSIONAL.**
**YOU AGREE THAT YOU, AND NOT COMMON, ARE SOLELY RESPONSIBLE FOR ENSURING THAT YOUR USE OF THE SERVICES, AND ANY ACTIONS YOU TAKE IN CONNECTION WITH ANY TOKENS (INCLUDING WITHOUT LIMITATION ANY MARKETING OR OTHER COMMUNICATIONS WITH RESPECT TO THE TOKENS) COMPLIES WITH APPLICABLE LAW.**
The Service provides an interface that allows users of our Website ("Users") to interact with and manage Digital Wallets owned and/or controlled by such Users. Each Digital Wallet is a system of software-based smart contracts interoperable with software installed on and operated through a user device, which such system enables users to hold and transact in cryptocurrency and other digital assets ("**Digital Assets**") across one or more third-party blockchains through a series of credible commitments. For the avoidance of doubt, your Digital Wallet is not part of the Website and is not a Service made available by Common under this Agreement. Common has no obligation to monitor or control any use of any Digital Wallet by you or any third party on or through the Website and/or any use of any Digital Wallet that does not take place on or through the Website. Common makes no representations or warranties about the functionality of any Digital Wallet. All use of a Digital Wallet is undertaken at your own risk, and Common is not and shall not be liable to you or to any third party for any loss or damage arising from or connected to your or any third party's use of a Digital Wallet. Notwithstanding anything to the contrary set forth herein, the terms of Sections 10 through 12 of this Agreement apply, mutatis mutandis, to any claims arising out of your use of or inability to use any Digital Wallet.
**SECTION 16 CONTAINS PROVISIONS THAT GOVERN HOW TO RESOLVE DISPUTES BETWEEN YOU AND COMMON. AMONG OTHER THINGS, SECTION 16 INCLUDES AN AGREEMENT TO ARBITRATE WHICH REQUIRES, WITH LIMITED EXCEPTIONS, THAT ALL DISPUTES BETWEEN YOU AND US SHALL BE RESOLVED BY BINDING AND FINAL ARBITRATION. SECTION 16 ALSO CONTAINS A CLASS ACTION AND JURY TRIAL WAIVER. PLEASE READ SECTION 16 CAREFULLY.**
**UNLESS YOU OPT OUT OF THE ARBITRATION AGREEMENT WITHIN THIRTY (30) DAYS IN ACCORDANCE WITH SECTION 16: (1) YOU WILL ONLY BE PERMITTED TO PURSUE DISPUTES OR CLAIMS AND SEEK RELIEF AGAINST US ON AN INDIVIDUAL BASIS, NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS OR REPRESENTATIVE ACTION OR PROCEEDING, AND YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION; AND (2) YOU ARE WAIVING YOUR RIGHT TO PURSUE DISPUTES OR CLAIMS AND SEEK RELIEF IN A COURT OF LAW AND TO HAVE A JURY TRIAL.**
**ANY DISPUTE, CLAIM OR REQUEST FOR RELIEF RELATING IN ANY WAY TO YOUR USE OF THE WEBSITE WILL BE GOVERNED AND INTERPRETED BY AND UNDER THE LAWS OF NEW YORK, WITHOUT GIVING EFFECT TO ANY PRINCIPLES THAT PROVIDE FOR THE APPLICATION OF THE LAW OF ANY OTHER JURISDICTION. THE UNITED NATIONS CONVENTION ON CONTRACTS FOR THE INTERNATIONAL SALE OF GOODS IS EXPRESSLY EXCLUDED FROM THIS AGREEMENT.**
**PLEASE BE AWARE THAT SECTION 4.4 (COMMON COMMUNICATIONS) OF THIS AGREEMENT, BELOW, CONTAINS YOUR OPT-IN CONSENT TO RECEIVE COMMUNICATIONS FROM US.**
Your use of, and participation in, certain Services may be subject to additional terms ("**Supplemental Terms**") and such Supplemental Terms will either be listed in the Terms of Use or will be presented to you for your acceptance when you sign up to use the supplemental Service. If the Terms of Use are inconsistent with the Supplemental Terms, the Supplemental Terms shall control with respect to such Service. The Terms of Use and any applicable Supplemental Terms are referred to herein as the **Agreement**.
PLEASE NOTE THAT THE AGREEMENT IS SUBJECT TO CHANGE BY COMMON IN ITS SOLE DISCRETION AT ANY TIME. When changes are made, Common will make a new copy of the Terms of Use available at the Website and any new Supplemental Terms will be made available from within, or through, the affected Service on the Website. We will also update the "Last Updated" date at the top of the Terms of Use. If we make any material changes, we may notify you by email or by notification through the Services or through our social media channels. Any changes to the Agreement will be effective immediately for new users of the Website and/ or Services and will be effective thirty (30) days after posting notice of such changes on the Website for existing Users. Common may require you to provide consent to the updated Agreement in a specified manner before further use of the Website, and/or the Services is permitted. If you do not agree to any change(s) after receiving a notice of such change(s), you shall stop using the Services. Otherwise, your continued use of the Services constitutes your acceptance of such change(s). PLEASE REGULARLY CHECK THE WEBSITE TO VIEW THE THEN-CURRENT TERMS.
1.  **DESCRIPTION OF THE SERVICES.** The Services include the Website and Services enabled thereby, as further defined and described below. There are important risks and limitations associated with the use of the Services as described below and elsewhere in these Terms of Use. Please read them carefully.
1.1      **The Services.** Common's Services include a proprietary online platform enabled through the Website, and supported documentation made available therewith, that allows Users to create or join online communities of Users that meet certain criteria ("**Communities**"), create and post written or image-based content for discussion, connect to and transact through compatible third-party digital wallets (each, a "**Digital Wallet**"), and acquire or dispose of memecoins and other fungible Digital Assets ("**Tokens**"). Users may be able to use the Services to visualize any Tokens or other Digital Assets (collectively, "**User Assets**") that are associated with a Digital Wallet and write transactions to be executed by such Digital Wallet on third-party distributed ledgers compatible with the Services (each, a "**Supported Blockchain**") in accordance with the technological and contractual parameters of such Supported Blockchain (the applicable **Blockchain Rules**). User Asset visualizations may include graphs, projections, and other information about your User Assets (collectively, "**User Asset Information**"). Certain Users (each, a "**Project**") can also use certain Software and Services to mint and offer for sale unique collections of Tokens, as set forth herein, and use Software and other Services to manage such Tokens (all such Software and Services collectively, the "**Launchpad**").
1.2.     **Disclaimers.** THE SERVICES ARE AN ADMINISTRATIVE PLATFORM ONLY. THE SERVICES ARE NOT, AND COMMON DOES NOT PROVIDE, LEGAL OR COMPLIANCE SERVICES. FOR THE AVOIDANCE OF DOUBT, AND NOTWITHSTANDING ANYTHING ELSE SET FORTH HEREIN, YOU ARE SOLELY RESPONSIBLE FOR ENSURING THAT YOUR USE OF THE LAUNCHPAD, LAUNCH AND MANAGEMENT OF ANY TOKENS, OR OTHER USE OF THE SERVICES COMPLIES WITH APPLICABLE LAW, AND YOU ACKNOWLEDGE AND AGREE THAT COMMON SHALL HAVE NO LIABILITY TO YOU ARISING FROM OR RELATED TO SAME. When you use the Launchpad to offer any Tokens, you expressly release Common from any liability arising from or related to such Tokens or any User activity in connection with same, and you agree that you, and not Common, are solely responsible for your decision to use the Launchpad, Software, and any Services.
1.3.     **Common Software.** Your use of any software and associated documentation that is made available via the Service, including without limitation the Launchpad smart contracts ("**Software**") is governed by the terms of the license agreement that accompanies or is included with the Software, or by the license agreement expressly stated on the Website page(s) accompanying the Software. These license terms may be posted with the Software downloads or at the Website page where the Software can be accessed. Unless you agree to the terms of such license agreement, you shall not use, download, or install any Software that is accompanied by or includes a license agreement. At no time will Common provide you with any tangible copy of our Software. Common delivers access to the Software via electronic transfer or download and does not use or deliver any tangible media in connection with the (i) delivery, installation, updating or problem resolution of any Software (including any new releases); or (ii) delivery, correction or updating of documentation. Unless the accompanying license agreement expressly allows otherwise, any copying or redistribution of the Software is prohibited, including any copying or redistribution of the Software to any other server or location, or redistribution or use on a service bureau basis. If there is any conflict between this Agreement and the license agreement, the license agreement takes precedence in relation to that Software (except as provided in the following sentence). If the Software is a pre-release version, then, notwithstanding anything to the contrary included within an accompanying license agreement, you are not permitted to use or otherwise rely on the Software for any commercial or production purposes. If you and Common have not entered into a separate license agreement with respect to your use of the Software or if no license agreement accompanies use of the Software, use of the Software will be governed by this Agreement and, subject to your compliance with this Agreement, Common grants you a non-assignable, non-transferable, non-sublicensable, revocable, non-exclusive license to use the Software for the sole purpose of enabling you to use the Service in the manner permitted by this Agreement. Some Software may be offered under an OSS License (defined below). There may be provisions in the OSS License that expressly override this Agreement.
1.4.     **Open Source Software.** You acknowledge and agree that the Service may use, incorporate or link to certain software made available under an "open-source" or "free" license ("**OSS**" or **OSS License**, as applicable), and that your use of the Service is subject to, and you agree to comply with, any applicable OSS Licenses. Each item of OSS is licensed under the terms of the end-user license that accompanies such OSS. Nothing in this Agreement limits your rights under, or grants you rights that supersede, the terms and conditions of any applicable end user license for the OSS.
1.5.     **Communities.** Communities are made available through the Services, and all user (including User) activity on or in connection with such Communities is subject to this Agreement and any membership eligibility criteria or other supplemental terms applicable to a Community ("**Community Guidelines**").
        (a)      **Project Determines Community Guidelines.** When you join or otherwise participate in any Community, you acknowledge and agree that the terms of this Agreement and the applicable Community Guidelines apply to all such participation. Notwithstanding the foregoing, you acknowledge and agree that the Project that hosts the applicable Community, and not Common, is responsible for the policies and operation of such Community, including without limitation any membership eligibility criteria, and any action or inaction taken by such Project in connection with the enforcement of any Community Guidelines.
        (b)      **Moderation.** Moderating a Community, whether as a Project or individual User, is an unofficial, voluntary position. We do not verify or validate any User's right to access or moderate any Community and we are not responsible for any action taken by the moderators. If you choose to moderate a Community, you agree (i) to follow the AUP and the terms of this Agreement; (ii) to take appropriate action in response to reports related to the Community that you moderate, including without limitation escalating such reports to us; (iii) that you are not, and you shall not represent that you are, authorized to act on our behalf; (iv) not to enter into any agreement with any third party on behalf of us; (v) that you will use any non-public information to which you get access in connection with moderation only for the purposes of moderation; and (vi) any Community Guidelines you create for the Community that you moderate will not conflict with this Agreement.
1.6.     **Community Stake. "Stake" means an NFT asset that is created by a Project or other User when such User engages with certain Software through a Community, and may be subject to Supplemental Terms as set forth on the Service. There may be Fees associated with any User's use of or interaction with any Stake or the Software underlying such Stake, as further set forth on the Service. Your use of or interaction with the Stake relies on interactions with the applicable Supported Blockchain. For more information reference our documents at https://docs.common.xyz/.
1.7.     **Contests.** Projects and other Users may be able to use certain Software to host, operate, and run contests for members of such Users' Communities (each, a "**Contest**"), as further described on the Service in connection with the applicable Software or Service. The User that initiates a Contest is solely responsible for ensuring that their Contest and all marketing and promotional materials created by such User with respect thereto ("**Contest Rules**") complies with all applicable laws, rules, and regulations. Common does not review any Contest or any Contest Rules and does not represent that the Services are appropriate for all use cases or that your use of any Service in connection with any Contest complies with applicable law. For more information reference our documents at https://docs.common.xyz/.
1.8.     **Common Aura (Points) Program.** Subject to your ongoing compliance with this Agreement and any Common Aura Program Terms (defined below) made available by Common from time to time, Common may enable you to participate in a limited program that rewards users for interacting with the Service ("Common Aura Program") by allocating such users with Digital Assets that bear no cash or monetary value and are made available by Common. These Digital Assets are referred to as "Points" (known as "Aura" on the platform), as further described below. Your participation in the Common Aura Program constitutes your acceptance of the then-current terms and conditions applicable to the Common Aura Program at the time of such participation (the "Common Aura Program Terms"), as may be modified or updated by Common in its sole discretion. Additional terms applicable to the Common Aura Program, which shall constitute part of the CommonnAura Program Terms, may be set forth on the Services from time to time. For more information reference our documents at https://docs.common.xyz/.
1.9.     **Transactions on Supported Blockchains.** By combining publicly available information with your interactions with the Services, the Services can draft standard transaction messages that are designed to accomplish your operational goals as expressed through the interactions with the Services. You may broadcast such messages to the validator network for any Supported Blockchain in order to initiate a transaction of User Assets through your Digital Wallet. The User must personally review and authorize all transaction messages that the User wishes to execute; this requires the User to sign the relevant transaction message with the User's Private Key (defined below). The User-authorized message will then be broadcast to validators through the Digital Wallet, and the User may pay a Gas Fee to have the validators record the results of the transaction message on the applicable Supported Blockchain, resulting in a transfer of User Assets. Common and the Services are not agents or intermediaries of the User, do not store or have access to or control over any User Assets, Private Keys, passwords, Accounts or other property of the User, and are not capable of performing transactions or sending transaction messages on behalf of the User. All transactions relating to the Tokens ("Token Transactions") are effected and recorded solely through the interactions of the User with the respective Projects, who are not under the control of or affiliated with Common or the Services. Common does not process or transmit any such Token Transactions. 
1.10.     **Compatibility Risk.** The Services may not be compatible with all forms of cryptocurrency, blockchains, and/or types of transactions, and certain of your User Assets may not be compatible with the Services. Whether or not a User Asset is then-currently compatible with the Services may change at any time, in Common's sole discretion, with or without notice to you.
1.11.     **Taxes.** You are solely responsible (and Common has no responsibility) for determining what, if any, taxes apply to any transactions involving your User Assets.
1.12.     **AI Tools.** Our Services leverage certain third-party generative AI tools ("AI Tools") to collect, analyze, and respond to user prompts and requests in connection with the matching service and to provide automated advice with respect to dating and social interactions. By using any AI Tools, you hereby consent and authorize Common to share any Content (defined below) or other information you provide to the AI Tools with the applicable Third-Party Service in order to complete your request. YOU, AND NOT COMMON, SHALL BE SOLELY RESPONSIBLE FOR YOUR USE OF THE AI TOOLS. YOU ACKNOWLEDGE AND AGREE THAT ANY CONDUCT YOU ENGAGE IN AS A RESULT OF THE OUTPUT PROVIDED BY THE AI TOOLS IS AT YOUR OWN RISK. BECAUSE AI TOOLS UTILIZE ARTIFICIAL INTELLIGENCE TO COMMUNICATE WITH YOU, THE AI TOOLS MAY PROVIDE OUTPUT THAT IS INACCURATE, INAPPROPRIATE, OR DOES NOT COMPLY WITH APPLICABLE LAW. YOU AGREE THAT COMMON WILL NOT BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY OUTPUT PROVIDED BY AI TOOLS OR YOUR OR ANY THIRD PARTY'S USE OF OR RELIANCE ON SAME.
1.13.     **User Responsibility.** You are solely responsible for your interactions with other Users and any other parties with whom you interact, including without limitation any Project; provided, however, that Common reserves the right, but has no obligation, to intercede in such disputes. You agree that Common will not be responsible for any liability incurred as the result of such interactions.
2. **ELIGIBILITY; USER REPRESENTATIONS AND WARRANTIES.**
2.1.     **Registering Your Account.** To access certain features of the Services, you may be required to register an account on the Services ("**Account**"). Notwithstanding anything to the contrary herein, you acknowledge and agree that you have no ownership or other property interest in your Account, and you further acknowledge and agree that all rights in and to your Account are and will forever be owned by and inure to the benefit of Common. Furthermore, you are responsible for all activities that occur under your Account. You shall monitor your Account to restrict use by minors, and you will accept full responsibility for any unauthorized use of the Services by minors. You may not share your Account or password with anyone, and you agree to notify Common immediately of any unauthorized use of your password or any other breach of security. You shall not have more than one Account at any given time. Common reserves the right to remove or reclaim any usernames at any time and for any reason, including but not limited to, claims by a third party that a username violates the third party's rights. You agree not to create an Account or use the Services if you have been previously removed by Common, or if you have been previously banned from any of the Services.
2.2.     **Registration Data.** When you access or use the Services in any way, you agree to (a) provide true, accurate, current and complete information about yourself as may be prompted by the Services from time to time ("**Registration Data**"); and (b) maintain and promptly update the Registration Data to keep it true, accurate, current and complete. You acknowledge and agree that our obligation to provide you with any Services is conditioned on the Registration Data being accurate and complete at all times during the term of this Agreement. If you provide any information that is untrue, inaccurate, not current or incomplete, or Common has reasonable grounds to suspect that any information you provide is untrue, inaccurate, not current or incomplete, Common has the right to suspend or terminate your access to the Services and refuse any and all current or future use of the Services (or any portion thereof). You agree not to use the Services if you have been previously removed by Common, or if you have been previously banned from any of the Services. Common reserves the right to obtain and retain any Registration Data or other identifying information as it may determine from time to time in order for you to use and continue to use the Services.
2.3.     **Eligibility.** You represent and warrant that:
        (a)     You are (i) at least eighteen (18) years old; (ii) of legal age to form a binding contract; (iii) not a person barred from using Services under the laws of the United States, your place of residence or any other applicable jurisdiction; and (iv) not a current resident of the United States. If you are acting on behalf of a DAO or other entity, whether or not such entity is formally incorporated under the laws of your jurisdiction, you represent and warrant that you have all right and authority necessary to act on behalf of such entity; 
        (b)     None of: (i) you; (ii) any affiliate of any entity on behalf of which you are entering into this Agreement; (iii) any other person having a beneficial interest in any entity on behalf of which you are entering into this Agreement (or in any affiliate thereof); or (iv) any person for whom you are acting as agent or nominee in connection with this Agreement is: (A) a country, territory, entity or individual named on an OFAC list as provided at http://www.treas.gov/ofac, or any person or entity prohibited under the OFAC programs, regardless of whether or not they appear on the OFAC list; or (B) a senior foreign political figure, or any immediate family member or close associate of a senior foreign political figure. There is no legal proceeding pending that relates to your activities relating to buying, selling, staking, or otherwise using cryptocurrency or any other Token- or Digital Asset- trading or blockchain technology related activities;
        (c)     You have not failed to comply with, and have not violated, any applicable legal requirement relating to any blockchain technologies or token-trading activities or any other applicable laws, including, but not limited to, anti-money laundering or terrorist financing laws, and no investigation or review by any governmental entity is pending or, to your knowledge, has been threatened against or with respect to you, nor does any government order or action prohibit you or any of your representatives from engaging in or continuing any conduct, activity or practice relating to cryptocurrency.
2.4.     **Digital Wallets.** In connection with certain features of the Services you may need to send cryptocurrency assets to or from a Digital Wallet. If you do not have a Digital Wallet, the Services may allow you to create one using Magic Labs, Inc. ("**Magic**"). Creating a Digital Wallet through Magic is subject to additional terms and conditions between you and Magic. You represent that you are entitled to use such a Digital Wallet. Please note that if a Digital Wallet or associated service becomes unavailable then you should not attempt to use such Digital Wallet in connection with the Services, and we disclaim all liability in connection with the foregoing, including without limitation any inability to access any User Assets you have sent to such Digital Wallet. PLEASE NOTE THAT YOUR RELATIONSHIP WITH MAGIC OR ANY OTHER THIRD-PARTY SERVICE PROVIDERS ASSOCIATED WITH YOUR DIGITAL WALLET IS GOVERNED SOLELY BY YOUR AGREEMENT(S) WITH SUCH THIRD-PARTY SERVICE PROVIDERS, AND COMMON DISCLAIMS ANY LIABILITY FOR INFORMATION THAT MAY BE PROVIDED TO IT OR USER ASSETS THAT MAY BE DEPLOYED TO ANY SUPPORTED BLOCKCHAIN BY OR THROUGH SUCH THIRD-PARTY SERVICE PROVIDERS IN VIOLATION OF THE SETTINGS THAT YOU HAVE SET IN SUCH DIGITAL WALLETS. Access to your Digital Wallet may require the use of a private key or passphrase ("Private Key") and Common has no ability to access your Digital Wallet without your involvement and authority. Your Private Key is unique to you, and shall be maintained by you. If you lose your Private Key, you may lose access to your Digital Wallet and any contents thereof. Common does not have the ability to recover a lost Private Key. While a Digital Wallet may be interoperable with other compatible blockchain platforms, tokens, or services, only User Assets supported by Common that are stored in your Digital Wallet will be accessible through the Services. When you use the Services in connection with any User Assets, you represent and warrant that (a) you own or have the authority to connect to the applicable Digital Wallet; (b) you own or have the authority to deploy such User Assets; (c) all User Assets you deploy, transfer, deposit, or otherwise make available in connection with our Services have been earned, received, or otherwise acquired by you in compliance with all applicable laws; and (d) no User Assets that you deploy, transfer, deposit, or otherwise make available in connection with the Services have been "tumbled" or otherwise undergone any process designed to hide, mask, or obscure the origin or ownership of such User Assets.
2.5.     **Access Through a Linked App.** The Service may allow you to link your Account with a third-party Digital Wallet or valid account on a third-party platform or social network (each, a "**Linked Account**") by allowing Common to access your Linked Account, as is permitted under the applicable terms and conditions that govern your use of each Linked Account. You represent that you are entitled to disclose your Linked Account login information to Common and/or grant Common access to your Linked Account (including, but not limited to, for use for the purposes described herein) without breach by you of any of the terms and conditions that govern your use of the applicable Linked Account and without obligating Common to pay any fees or making Common subject to any usage limitations imposed by such Third-Party Service providers. By granting Common access to any Linked Account, you understand that Common may access, make available and store (if applicable) any information, data, text, software, music, sound, photographs, graphics, video, messages, tags and/or other materials ("**Content**") that you have provided to and stored in your Linked Account ("**Linked App Content**") so that it is available on and through the Service via your Account. Unless otherwise specified in this Agreement, all Linked App Content is considered to be Your Content (defined below) for all purposes of this Agreement. Depending on the Linked Accounts you choose and subject to the privacy settings that you have set in such Linked Accounts, personally identifiable information that you post to your Linked Accounts may be available on and through your Account on the Service. If a Linked Account or associated service becomes unavailable, or Common's access to such Linked Account is terminated by the Third-Party Service provider, then Linked App Content will no longer be available on and through the Service. YOUR RELATIONSHIP WITH THE THIRD-PARTY SERVICE PROVIDERS ASSOCIATED WITH YOUR THIRD-PARTY ACCOUNTS IS GOVERNED SOLELY BY YOUR AGREEMENT(S) WITH SUCH THIRD-PARTY SERVICE PROVIDERS, AND COMMON DISCLAIMS ANY LIABILITY FOR PERSONALLY IDENTIFIABLE INFORMATION THAT MAY BE PROVIDED TO IT BY SUCH THIRD-PARTY SERVICE PROVIDERS IN VIOLATION OF THE PRIVACY SETTINGS THAT YOU HAVE SET IN SUCH THIRD-PARTY ACCOUNTS. Common makes no effort to review any Linked App Content for any purpose, including but not limited to, for accuracy, legality or noninfringement, and Common is not responsible for any Linked App Content.
2.6.     **Necessary Equipment and Software.** You must provide all equipment and software necessary to connect to the Services, including but not limited to, a mobile device that is suitable to connect with and use the Services as applicable. You are solely responsible for any fees, including Internet connection or mobile fees, that you incur when accessing the Services.
**YOUR ASSUMPTION OF RISK.**
3.1.  
`;

const TermsPage = () => {
  const navigate = useCommonNavigate();

  return (
    <div className="TermsPage">
      <div className="forum-container">
        <CWText type="h3">Terms of Agreement</CWText>
        <CWText>Last Updated Date: 3/8/2025</CWText>
        {/* {renderMultilineTextWithBold(TOS)} */}
        <ol>
          <li>
            First main point
            <ol type="a">
              <li>First subpoint</li>
              <li>Second subpoint</li>
              <li>Third subpoint</li>
            </ol>
          </li>
          <li>
            Second main point
            <ol type="a">
              <li>First subpoint</li>
              <li>Second subpoint</li>
            </ol>
          </li>
          <li>
            Third main point
            <ol type="a">
              <li>First subpoint</li>
              <li>Second subpoint</li>
              <li>Third subpoint</li>
            </ol>
          </li>
        </ol>
        <CWText
          onClick={() => {
            navigate('/privacy');
          }}
          className="link"
        >
          Privacy Policy
        </CWText>
        <CWText
          onClick={() => {
            navigate('/tos-7-10-24');
          }}
          className="link"
        >
          Previous Terms of Service
        </CWText>
      </div>
    </div>
  );
};

export default TermsPage;
