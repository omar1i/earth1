import coast from '@/assets/oman-coast.webp';
import camping from '@/assets/oman-camping.webp';
import wadi from '@/assets/oman-wadi.webp';
import mountains from '@/assets/oman-mountains.webp';
import type { Bilingual, Language } from './language';
export const images = {coast, camping, wadi};
// Pictures that ship with the site. The database refers to them as asset:<name>; trips can also use an uploaded image or any https URL.
export const assetImages: Record<string,string> = {coast, camping, wadi, mountains};
export const whatsapp = 'https://api.whatsapp.com/send?phone=96891915594';
export const instagram = 'https://www.instagram.com/earthadventure_/';
export const bi = (en: string, ar: string): Bilingual => ({en, ar});
export const categories = [
 {id:'sea-fishing', title:bi('Sea & Fishing','البحر والصيد'), full:bi('Sea Trips & Fishing Adventures','الرحلات البحرية ومغامرات الصيد'), tagline:bi('Find your freedom on the open sea.','اكتشف حريتك في عرض البحر.'), description:bi('Open water, coastal horizons, and time well spent together. Explore sea fishing, private boat trips, and marine excursions tailored to your request.','مياه مفتوحة وآفاق ساحلية ولحظات جميلة معًا. استكشف الصيد البحري ورحلات القوارب الخاصة والجولات البحرية حسب طلبك.'), image:coast, icon:'sea'},
 {id:'camping-overnight', title:bi('Camping & Overnight','التخييم والمبيت'), full:bi('Camping & Overnight Experiences','تجارب التخييم والمبيت'), tagline:bi('Slow down. Stay a little longer.','تمهّل. واستمتع بإقامة أطول.'), description:bi('Trade the everyday for quiet evenings outdoors. Request a camping escape or a private overnight arrangement, with every detail agreed before you travel.','استبدل روتين الحياة بأمسيات هادئة في الطبيعة. اطلب رحلة تخييم أو إقامة خاصة، مع الاتفاق على جميع التفاصيل قبل الرحلة.'), image:camping, icon:'camp'},
 {id:'land-adventures', title:bi('Land Adventures','المغامرات البرية'), full:bi('Land Adventures & Outdoor Exploration','المغامرات البرية واستكشاف الطبيعة'), tagline:bi('Take the path less travelled.','اسلك طريقًا مختلفًا.'), description:bi('Discover the outdoors at your own pace. Share your interests in mountain trails, scenic landscapes, and outdoor exploration, and let us discuss a suitable adventure.','اكتشف الطبيعة بالوتيرة التي تناسبك. شاركنا اهتماماتك بالمسارات الجبلية والمناظر الطبيعية والاستكشاف لنناقش مغامرة مناسبة.'), image:wadi, icon:'land'},
];
export type Experience = {id:string; category:string; name:Bilingual; description:Bilingual; image?:string; region?:'oman'|'international'; price:number|null; priceType:'fixed'|'person'|'group'|'contact'; location?:Bilingual; duration?:Bilingual; maxGroup?:number; itinerary?:Bilingual[]; inclusions?:Bilingual[]; exclusions?:Bilingual[]; requirements?:Bilingual[]; accommodation?:Bilingual; destination?:string};
// Inquiry options: specific locations, durations, equipment and prices are intentionally unconfigured.
export const experiences: Experience[] = [
 {id:'sea-fishing', category:'sea-fishing', name:bi('Sea Fishing Adventure','مغامرة الصيد البحري'), description:bi('A fresh perspective, an open horizon, and the possibility of your next great catch. Tell us about the fishing trip you have in mind.','آفاق مفتوحة وتجربة مختلفة وفرصة لصيدك القادم. أخبرنا عن رحلة الصيد التي تتطلع إليها.'), image:coast, price:null, priceType:'contact'},
 {id:'private-boat', category:'sea-fishing', name:bi('Private Boat Escape','رحلة قارب خاصة'), description:bi('Make time for the sea with a private boat trip planned around your group. Routes and arrangements are confirmed with our team.','استمتع بالبحر في رحلة قارب خاصة تُخطط حسب مجموعتك. تُؤكد المسارات والترتيبات مع فريقنا.'), image:coast, price:null, priceType:'contact'},
 {id:'camping-escape', category:'camping-overnight', name:bi('An Escape Under the Stars','رحلة تحت النجوم'), description:bi('Disconnect from the rush and reconnect with nature. Request an overnight camping escape and discuss the setting and arrangements with us.','ابتعد عن صخب الحياة وتواصل مع الطبيعة. اطلب رحلة تخييم ليلية وناقش معنا المكان والترتيبات.'), image:camping, price:null, priceType:'contact'},
 {id:'private-camping', category:'camping-overnight', name:bi('Your Private Camping Getaway','رحلة تخييم خاصة'), description:bi('An outdoor escape for your own circle. Share your preferences for a private camping experience, from the setting to the length of your stay.','رحلة في الطبيعة مع من تحب. شاركنا تفضيلاتك لتجربة تخييم خاصة، من المكان إلى مدة الإقامة.'), image:camping, price:null, priceType:'contact'},
 {id:'outdoor-exploration', category:'land-adventures', name:bi('Outdoor Exploration','استكشاف الطبيعة'), description:bi('Discover another side of Oman, beyond the everyday. Tell us what inspires you and we will discuss a suitable outdoor journey.','اكتشف جانبًا آخر من عُمان بعيدًا عن المألوف. أخبرنا بما يلهمك لنناقش رحلة مناسبة في الطبيعة.'), image:wadi, price:null, priceType:'contact'},
 {id:'mountain-adventure', category:'land-adventures', name:bi('Mountain Adventure','مغامرة جبلية'), description:bi('Fresh air, dramatic landscapes, and a different point of view. Request a mountain adventure matched to your interests and experience.','هواء نقي ومناظر رائعة ورؤية مختلفة. اطلب مغامرة جبلية تناسب اهتماماتك وخبرتك.'), image:wadi, price:null, priceType:'contact'},
 // SAMPLE: replace with the real Masirah Island trip details.
 {id:'masirah-island', category:'sea-fishing', region:'oman', name:bi('Masirah Island','جزيرة مصيرة'), description:bi('A sample island trip idea: coastal scenery, open sea, and time outdoors. Share your preferences and our team will discuss the details with you.','فكرة رحلة نموذجية إلى الجزيرة: مناظر ساحلية وبحر مفتوح ووقت في الطبيعة. شاركنا تفضيلاتك وسيناقش فريقنا التفاصيل معك.'), image:coast, price:null, priceType:'contact'},
 // SAMPLE: international trips — replace names, descriptions and add photos when ready (no photo shows a neutral placeholder).
 {id:'intl-sample-1', category:'international', region:'international', name:bi('Mountain Journey Abroad','رحلة جبلية خارج عُمان'), description:bi('A sample international trip idea for travellers who love mountain scenery. Contact us to discuss destinations and details.','فكرة رحلة دولية نموذجية لمحبي المناظر الجبلية. تواصل معنا لمناقشة الوجهات والتفاصيل.'), price:null, priceType:'contact'},
 {id:'intl-sample-2', category:'international', region:'international', name:bi('Island Getaway Abroad','رحلة جزر خارج عُمان'), description:bi('A sample international trip idea built around the sea and island life. Contact us to discuss destinations and details.','فكرة رحلة دولية نموذجية حول البحر وأجواء الجزر. تواصل معنا لمناقشة الوجهات والتفاصيل.'), price:null, priceType:'contact'},
 {id:'intl-sample-3', category:'international', region:'international', name:bi('Culture & City Journey','رحلة ثقافية إلى المدن'), description:bi('A sample international trip idea for discovering new cities and cultures. Contact us to discuss destinations and details.','فكرة رحلة دولية نموذجية لاكتشاف مدن وثقافات جديدة. تواصل معنا لمناقشة الوجهات والتفاصيل.'), price:null, priceType:'contact'},
];
export const regionOf=(e:Experience)=>e.region??'oman';
export const omanExperiences=experiences.filter(e=>regionOf(e)==='oman');
export const internationalExperiences=experiences.filter(e=>regionOf(e)==='international');
export const destinations = [
 {id:'coast', name:bi('The Omani Coast','الساحل العُماني'), subtitle:bi('Where the mountains meet the sea','حيث تلتقي الجبال بالبحر'), description:bi('Blue horizons, quiet coves, and spectacular coastal landscapes. Oman’s coastline offers an unforgettable perspective on the outdoors.','آفاق زرقاء وخلجان هادئة ومناظر ساحلية خلابة. يقدم ساحل عُمان رؤية لا تُنسى للطبيعة.'), image:coast},
 {id:'desert', name:bi('Desert Landscapes','المناظر الصحراوية'), subtitle:bi('A world of stillness and wonder','عالم من السكينة والدهشة'), description:bi('Sculpted dunes and wide-open skies reveal the quiet beauty of Oman’s desert environments.','كثبان منحوتة وسماء واسعة تكشف جمال البيئات الصحراوية الهادئ في عُمان.'), image:camping},
 {id:'mountains-wadis', name:bi('Mountains & Wadis','الجبال والأودية'), subtitle:bi('Follow your sense of discovery','اتبع شغفك بالاكتشاف'), description:bi('Rugged peaks, palm-lined valleys, and remarkable natural scenery make Oman a place to explore with curiosity.','قمم شاهقة وأودية تحفها النخيل ومناظر طبيعية رائعة تجعل عُمان وجهة للاستكشاف بشغف.'), image:wadi},
 {id:'islands', name:bi('Islands & Remote Shores','الجزر والشواطئ النائية'), subtitle:bi('A little further from the everyday','بعيدًا عن روتين الحياة'), description:bi('Remote coastal landscapes and island horizons invite a slower way of seeing Oman. Ask our team which locations can be arranged.','مناظر ساحلية نائية وآفاق جزر تدعوك للاستمتاع بعُمان بهدوء. اسأل فريقنا عن المواقع التي يمكن ترتيب زيارتها.'), image:coast},
];
export const faqs: [Bilingual, Bilingual][] = [
 [bi('How can I book?','كيف يمكنني الحجز؟'),bi('Choose an experience and complete our on-site booking form. Your booking is preliminarily confirmed and our team sends you the bank transfer details.','اختر تجربة وأكمل نموذج الحجز على الموقع. يُؤكد حجزك مبدئيًا ويرسل لك فريقنا بيانات التحويل البنكي.')],
 [bi('Is my booking confirmed immediately?','هل يُؤكد الحجز فورًا؟'),bi('Your booking is preliminarily confirmed as soon as you submit the form. A message with the bank transfer details will reach you within minutes on WhatsApp or by email, and trip details are agreed directly with our team.','يُؤكد حجزك مبدئيًا بمجرد إرسال النموذج. ستصلك خلال دقائق رسالة ببيانات التحويل البنكي عبر واتساب أو البريد الإلكتروني، ويُتفق على تفاصيل الرحلة مباشرة مع فريقنا.')],
 [bi('What is included in each experience?','ما الذي تتضمنه كل تجربة؟'),bi('Inclusions vary and are agreed directly with our team. Do not assume meals, tents, transport, accommodation, or equipment are included.','تختلف المشمولات ويُتفق عليها مباشرة مع فريقنا. لا تفترض أن الوجبات أو الخيام أو النقل أو الإقامة أو المعدات مشمولة.')],
 [bi('Can I arrange a private trip?','هل يمكن ترتيب رحلة خاصة؟'),bi('You can request a private boat, camping, or land experience. Tell us your preferences and we will discuss what can be arranged.','يمكنك طلب تجربة خاصة بالقارب أو التخييم أو البر. أخبرنا بتفضيلاتك لنناقش الترتيبات الممكنة.')],
 [bi('Can I book for a group?','هل يمكنني الحجز لمجموعة؟'),bi('Yes, you can book for a group. Include the number of participants; group capacity is agreed for the selected experience.','نعم، يمكنك الحجز لمجموعة. أضف عدد المشاركين؛ يُتفق على سعة المجموعة حسب التجربة المختارة.')],
 [bi('What should I bring?','ماذا ينبغي أن أحضر؟'),bi('Our team will discuss the requirements and recommended items for your selected experience before your trip.','سيناقش فريقنا المتطلبات والأغراض الموصى بها لتجربتك المختارة قبل الرحلة.')],
 [bi('What if the weather is unsuitable?','ماذا لو كانت الظروف الجوية غير مناسبة؟'),bi('Contact our team to discuss conditions and the options for your request. Any changes or arrangements will be agreed directly.','تواصل مع فريقنا لمناقشة الظروف والخيارات المتاحة لطلبك. يُتفق على أي تغييرات أو ترتيبات مباشرة.')],
 [bi('What are the cancellation and refund policies?','ما سياسة الإلغاء واسترداد الأموال؟'),bi('Please ask our team for the applicable cancellation, payment, and refund terms.','يرجى سؤال فريقنا عن شروط الإلغاء والدفع واسترداد الأموال المطبقة.')],
 [bi('How can I contact Earth Adventure?','كيف يمكنني التواصل مع Earth Adventure؟'),bi('Reach us on WhatsApp at +96891915594 or through Instagram @earthadventure_. You can also book on this website.','تواصل معنا عبر واتساب على +96891915594 أو إنستغرام @earthadventure_. يمكنك أيضًا الحجز عبر هذا الموقع.')],
];
export const values: [Bilingual, Bilingual][] = [
 [bi('Made for your kind of adventure','مغامرات تناسبك'),bi('From a quiet escape to a shared outdoor journey, start with what inspires you.','من رحلة هادئة إلى مغامرة جماعية، ابدأ بما يلهمك.')],
 [bi('Better, together','أجمل معًا'),bi('Experiences for individuals, friends, families, and groups.','تجارب للأفراد والأصدقاء والعائلات والمجموعات.')],
 [bi('A personal approach','اهتمام شخصي'),bi('Talk directly with our team and plan the details that matter to you.','تحدث مباشرة مع فريقنا وخطط للتفاصيل المهمة لك.')],
 [bi('Naturally unforgettable','طبيعة لا تُنسى'),bi('Discover the beauty of Oman, from open sea to remarkable landscapes.','اكتشف جمال عُمان من البحر المفتوح إلى المناظر الطبيعية الرائعة.')],
];
export function pageHead(lang: Language, title: Bilingual, description: Bilingual) {const full=`${title[lang]} | Earth Adventure ${lang==='ar'?'عُمان':'Oman'}`;const d=description[lang];return {meta:[{title:full},{name:'description',content:d},{property:'og:title',content:full},{property:'og:description',content:d},{property:'og:type',content:'website'},{property:'og:locale',content:lang==='ar'?'ar_OM':'en_US'},{name:'twitter:card',content:'summary_large_image'}]};}

// ---------------------------------------------------------------------------------------------
// Oman Trips: Private Trips (inspiration cards -> WhatsApp) and Group Trips (scheduled trips with
// their own detail page). PHOTOS: the four destination photos below reuse the site's existing
// pictures as stand-ins; drop real photos into src/assets, import them above and set `image`.
// ---------------------------------------------------------------------------------------------
export const privateTripsIntro = {
  title: bi('Private Trips','الرحلات الخاصة'),
  text: bi('Trips designed around your wishes and interests, whether you want to travel with family or friends, or plan a personal experience. You choose the destination, the activities and the kind of experience that suits you, and we arrange a travel programme that fits your needs and lets you enjoy your trip your own way.','رحلات تُصمَّم حسب رغبتك واهتماماتك، سواء كنت تبي تسافر مع الأهل أو الأصدقاء أو تخطط لتجربة خاصة. تختار الوجهة والأنشطة ونوع التجربة اللي تناسبك، ونرتب لك برنامج سفر يناسب احتياجاتك ويخليك تستمتع برحلتك على طريقتك.'),
};
export type BoatSpec = {label:Bilingual; value:Bilingual};
// "Our Boat" section of a private trip page. Everything is optional and editable in the admin dashboard.
export type PrivateBoat = {name:Bilingual; tagline:Bilingual; description:Bilingual; image?:string; specs:BoatSpec[]; amenities:Bilingual[]};
export type PrivateDestination = {
  id:string; name:Bilingual; description:Bilingual; image:string;
  tag?:Bilingual;                 // short label printed on the card photo, e.g. "Fishing trip"
  price?:Bilingual;               // ready-to-show price text (only when a real price is set)
  maxGuests?:number;              // maximum number of people
  location?:Bilingual; duration?:Bilingual;
  itinerary?:{title:Bilingual; text:Bilingual}[];
  showItinerary?:boolean;         // admin switch: show the itinerary on the trip page
  showCancellation?:boolean;      // admin switch: show the cancellation policy on the trip page
  cancellation?:Bilingual[];      // custom policy for this trip; empty = the standard policy below
  boat?:PrivateBoat;              // admin switch + content of the "Our Boat" section
  sample?:boolean;
};
export const privateDestinations: PrivateDestination[] = [
  {id:'wadi-al-arbaeen', name:bi('Wadi Al Arbaeen','وادي العربيين'), image:wadi, description:bi('A hidden valley of rugged rock walls and natural pools. Hike, take a swim stop, and enjoy quiet time in nature with your group.','وادٍ مخفي بجدران صخرية وبرك طبيعية. امشِ في الوادي واستمتع بالسباحة وبالهدوء في الطبيعة مع مجموعتك.')},
  {id:'jabal-akhdar', name:bi('Jabal Akhdar','الجبل الأخضر'), image:mountains, description:bi('Cool mountain air, terraced orchards and wide canyon viewpoints. Ideal for scenic hikes, village walks and a slower pace above the clouds.','هواء جبلي منعش ومدرجات زراعية وإطلالات واسعة على الأخاديد. مثالي للمشي في الطبيعة وجولات القرى وإيقاع أهدأ فوق الغيوم.')},
  {id:'masirah-island', name:bi('Masirah Island','جزيرة مصيرة'), image:coast, description:bi('Long empty beaches, clear water and an easy island pace. Plan time for fishing, beach camping and watching the coast from the sea.','شواطئ طويلة هادئة ومياه صافية وإيقاع جزيرة مريح. خطط لوقت للصيد والتخييم على الشاطئ ومشاهدة الساحل من البحر.'),
   // SAMPLE details: replace the price, guest number, itinerary and boat facts with the real ones in the admin dashboard.
   sample:true, tag:bi('Fishing Trip','رحلة صيد'), price:bi('Sample price: OMR 450 per group','سعر تجريبي: 450 ر.ع. للمجموعة'), maxGuests:10,
   location:bi('Masirah Island, Oman','جزيرة مصيرة، عُمان'), duration:bi('Full day (sunrise to sunset)','يوم كامل (من الشروق إلى الغروب)'),
   showItinerary:true, showCancellation:true,
   itinerary:[
    {title:bi('Sunrise · Departure','الشروق · الانطلاق'), text:bi('Meet at the marina, a short safety briefing, then head out to the fishing grounds.','اللقاء في المرسى وإرشادات سلامة سريعة ثم الانطلاق نحو مواقع الصيد.')},
    {title:bi('Morning · Fishing','الصباح · الصيد'), text:bi('Several fishing stops with all gear on board. Your catch stays fresh in the fish tank.','عدة محطات للصيد مع كامل المعدات على القارب، ويبقى صيدك طازجًا في خزان السمك.')},
    {title:bi('Midday · Sea and shade','الظهيرة · البحر والظل'), text:bi('A swim and snorkel stop in clear water, then lunch and a rest under the canopy.','وقفة للسباحة والغطس في مياه صافية ثم غداء واستراحة تحت المظلة.')},
    {title:bi('Sunset · Return','الغروب · العودة'), text:bi('One last stop for the catch, then a slow ride back along the coast as the light fades.','محطة أخيرة للصيد ثم رحلة هادئة للعودة على الساحل مع غروب الشمس.')},
   ],
   boat:{
    name:bi('Our Boat','قاربنا'), tagline:bi('Built for open water, set up for a full day at sea.','مجهّز للمياه المفتوحة ولليوم الكامل في البحر.'),
    description:bi('A stable, spacious boat with shade, fishing gear and safety equipment on board, so your group can focus on the sea.','قارب ثابت وواسع مع مظلات ومعدات صيد وسلامة على متنه، لتركّز مجموعتك على البحر.'),
    specs:[
     {label:bi('Vessel','القارب'), value:bi('Royal Craft 42','رويال كرافت 42')},
     {label:bi('Length','الطول'), value:bi('42 ft','42 قدمًا')},
     {label:bi('Engines','المحركات'), value:bi('Triple 300hp','ثلاثة محركات 300 حصان')},
     {label:bi('Max capacity','السعة القصوى'), value:bi('10 guests','10 أشخاص')},
     {label:bi('Departure','نقطة الانطلاق'), value:bi('Masirah Island Marina','مرسى جزيرة مصيرة')},
     {label:bi('Trip type','نوع الرحلة'), value:bi('Full day','يوم كامل')},
    ],
    amenities:[bi('Onboard bathroom with shower','حمّام مع دش على القارب'),bi('Fish tank to keep the catch fresh','خزان سمك للحفاظ على الصيد طازجًا'),bi('Trolling motor for precision fishing','محرك تحكم دقيق للصيد'),bi('Radar for navigation and safety','رادار للملاحة والسلامة'),bi('Sunshade canopy','مظلة للحماية من الشمس'),bi('Fishing gear included','معدات الصيد متوفرة'),bi('Snorkeling equipment','معدات غطس'),bi('Life jackets (all sizes)','سترات نجاة بجميع المقاسات'),bi('Cooler and ice box','صندوق تبريد وثلج'),bi('Bluetooth speaker','سماعة بلوتوث'),bi('GPS navigation','نظام ملاحة GPS'),bi('First aid kit','حقيبة إسعافات أولية'),bi('Fuel included','الوقود مشمول')],
   }},
  {id:'salalah', name:bi('Salalah','صلالة'), image:camping, description:bi('Green hills, coastal scenery and a very different side of Oman, especially in the khareef season. Explore the coast and valleys at your own pace.','تلال خضراء ومناظر ساحلية وجانب مختلف تمامًا من عُمان، خصوصًا في موسم الخريف. استكشف الساحل والأودية بالوتيرة التي تناسبك.')},
];
export const privateTripWhatsapp=(name:string)=>`${whatsapp}&text=${encodeURIComponent('Hello! I would like to plan a private trip to '+name+'.')}`;

export type GroupTrip = {
  id:string; name:Bilingual; description:Bilingual; image:string;
  gallery?:string[]; // cover first, then the extra photos added in the admin (slideshow on the card and trip page)
  location:Bilingual; duration:Bilingual; groupSize:Bilingual;
  startDate:string; // ISO date (YYYY-MM-DD) the booking form uses; customers cannot pick another date
  date:Bilingual; price:Bilingual;
  itinerary:{title:Bilingual; text:Bilingual}[];
  inclusions:Bilingual[]; exclusions:Bilingual[]; terms:Bilingual[];
  sample:boolean; // true = the date, price and terms are placeholders, not real trip details
  schedules?:Schedule[]; // departures with seat availability (present when the trip comes from the database)
};
// One departure of a group trip. seatsLeft = capacity minus seats already booked.
export type Schedule = {id:number; date:string; time:string|null; label:Bilingual; capacity:number; seatsLeft:number; bookable:boolean; soldOut:boolean};
const sampleExclusions:Bilingual[]=[bi('Personal expenses and souvenirs','المصاريف الشخصية والهدايا التذكارية'),bi('Travel insurance','التأمين على السفر'),bi('Anything not listed under “What’s included”','أي شيء غير مذكور ضمن «ما يشمله السعر»')];
const sampleTerms:Bilingual[]=[
  bi('SAMPLE TERMS: to be replaced with Earth Adventure’s real terms before publishing.','شروط تجريبية: تُستبدل بشروط Earth Adventure الفعلية قبل النشر.'),
  bi('A seat is confirmed once our team confirms availability and payment arrangements with you.','يتأكد المقعد بعد أن يؤكد فريقنا التوفر وترتيبات الدفع معك.'),
  bi('Cancellation and refund terms are confirmed by our team before you pay.','يؤكد فريقنا شروط الإلغاء والاسترداد قبل الدفع.'),
  bi('The programme may change because of weather, safety or local conditions. Please follow the guide’s instructions.','قد يتغير البرنامج بسبب الطقس أو السلامة أو الظروف المحلية. يرجى اتباع تعليمات المرشد.'),
];
export const groupTrips: GroupTrip[] = [
  {id:'jabal-akhdar-trip', name:bi('Jabal Akhdar Trip','رحلة الجبل الأخضر'), image:mountains, sample:true,
   description:bi('Two days in the cool mountains: terraced villages, orchards, canyon viewpoints and a guided hike, travelling together with a small group.','يومان في الجبال المنعشة: قرى مدرجة وبساتين وإطلالات على الأخاديد ومسار مشي بصحبة مرشد، مع مجموعة صغيرة.'),
   location:bi('Jabal Akhdar, Oman','الجبل الأخضر، عُمان'), duration:bi('2 days / 1 night','يومان / ليلة واحدة'), groupSize:bi('Small group (sample: up to 14 travellers)','مجموعة صغيرة (تجريبي: حتى 14 مسافرًا)'),
   startDate:'2026-11-20', date:bi('Sample date: 20–21 November 2026','تاريخ تجريبي: 20–21 نوفمبر 2026'), price:bi('Sample price: OMR 65 per person','سعر تجريبي: 65 ر.ع. للشخص'),
   itinerary:[
    {title:bi('Day 1 · Muscat to the mountain','اليوم 1 · من مسقط إلى الجبل'), text:bi('Morning pick-up in Muscat and a scenic drive up to the plateau. Afternoon village walk through terraced orchards, then sunset at a canyon viewpoint.','انطلاق صباحي من مسقط وطريق جبلي إلى الهضبة. جولة بعد الظهر بين المدرجات الزراعية ثم غروب الشمس من أحد مواقع الإطلالة.')},
    {title:bi('Day 1 · Evening','اليوم 1 · المساء'), text:bi('Group dinner and an overnight stay on the mountain.','عشاء جماعي ومبيت في الجبل.')},
    {title:bi('Day 2 · Hike and return','اليوم 2 · المشي والعودة'), text:bi('Early breakfast and a guided hike with views over the canyon. Lunch, free time, then the drive back to Muscat.','فطور مبكر ومسار مشي بصحبة مرشد مع إطلالات على الأخدود. غداء ووقت حر ثم العودة إلى مسقط.')},
   ],
   inclusions:[bi('Return transport from Muscat','النقل ذهابًا وإيابًا من مسقط'),bi('One night’s accommodation','إقامة ليلة واحدة'),bi('Meals mentioned in the itinerary','الوجبات المذكورة في البرنامج'),bi('Trip leader / local guide','قائد الرحلة / مرشد محلي')],
   exclusions:sampleExclusions, terms:sampleTerms},
  {id:'muscat-trip', name:bi('Muscat Trip','رحلة مسقط'), image:coast, sample:true,
   description:bi('A day exploring Muscat: the coast, the old quarters and the sea, with a small group and a local guide.','يوم لاستكشاف مسقط: الساحل والأحياء القديمة والبحر، مع مجموعة صغيرة ومرشد محلي.'),
   location:bi('Muscat, Oman','مسقط، عُمان'), duration:bi('1 day','يوم واحد'), groupSize:bi('Small group (sample: up to 14 travellers)','مجموعة صغيرة (تجريبي: حتى 14 مسافرًا)'),
   startDate:'2026-11-28', date:bi('Sample date: 28 November 2026','تاريخ تجريبي: 28 نوفمبر 2026'), price:bi('Sample price: OMR 25 per person','سعر تجريبي: 25 ر.ع. للشخص'),
   itinerary:[
    {title:bi('Morning','الصباح'), text:bi('Meet the group and start along the Muscat coast with the first stops and photo points.','لقاء المجموعة والانطلاق على طول ساحل مسقط مع أولى المحطات ونقاط التصوير.')},
    {title:bi('Midday','الظهيرة'), text:bi('Explore the old quarters and local markets, then lunch together.','استكشاف الأحياء القديمة والأسواق المحلية ثم غداء جماعي.')},
    {title:bi('Afternoon','بعد الظهر'), text:bi('A relaxed time by the sea and a sunset stop before heading back.','وقت هادئ على البحر ومحطة لمشاهدة الغروب قبل العودة.')},
   ],
   inclusions:[bi('Local transport during the day','النقل المحلي خلال اليوم'),bi('Lunch (sample)','الغداء (تجريبي)'),bi('Trip leader / local guide','قائد الرحلة / مرشد محلي')],
   exclusions:sampleExclusions, terms:sampleTerms},
  {id:'masirah-island-trip', name:bi('Masirah Island Trip','رحلة جزيرة مصيرة'), image:coast, sample:true,
   description:bi('Three days on Masirah: long beaches, clear water and island life, travelling together with a small group.','ثلاثة أيام في مصيرة: شواطئ طويلة ومياه صافية وحياة الجزيرة، مع مجموعة صغيرة.'),
   location:bi('Masirah Island, Oman','جزيرة مصيرة، عُمان'), duration:bi('3 days / 2 nights','3 أيام / ليلتان'), groupSize:bi('Small group (sample: up to 12 travellers)','مجموعة صغيرة (تجريبي: حتى 12 مسافرًا)'),
   startDate:'2026-12-11', date:bi('Sample date: 11–13 December 2026','تاريخ تجريبي: 11–13 ديسمبر 2026'), price:bi('Sample price: OMR 110 per person','سعر تجريبي: 110 ر.ع. للشخص'),
   itinerary:[
    {title:bi('Day 1 · Journey to the island','اليوم 1 · الرحلة إلى الجزيرة'), text:bi('Travel from Muscat to the departure point, cross to the island and settle in.','السفر من مسقط إلى نقطة العبور ثم الوصول إلى الجزيرة والاستقرار.')},
    {title:bi('Day 2 · Island day','اليوم 2 · يوم الجزيرة'), text:bi('Explore beaches and the coast, with time for the sea and an evening together.','استكشاف الشواطئ والساحل مع وقت للبحر وأمسية جماعية.')},
    {title:bi('Day 3 · Return','اليوم 3 · العودة'), text:bi('Morning on the beach, then the crossing and the journey back to Muscat.','صباح على الشاطئ ثم العبور والعودة إلى مسقط.')},
   ],
   inclusions:[bi('Transport from Muscat and the island crossing (sample)','النقل من مسقط وعبور الجزيرة (تجريبي)'),bi('Two nights’ accommodation','إقامة ليلتين'),bi('Meals mentioned in the itinerary','الوجبات المذكورة في البرنامج'),bi('Trip leader / local guide','قائد الرحلة / مرشد محلي')],
   exclusions:sampleExclusions, terms:sampleTerms},
];

// Cancellation & refund policy: shown on every group trip page under the Notes section.
export const cancellationPolicy = {
  title: bi('Cancellation Policy','سياسة الإلغاء'),
  items: [
    bi('In case of booking cancellation, the refund and cancellation terms set out below apply.','في حال إلغاء الحجز، تُطبَّق شروط الاسترداد والإلغاء الموضحة أدناه.'),
    bi('A deposit of OMR 150 is paid to confirm the booking and is non-refundable.','يُدفع عربون بقيمة 150 ريالًا لتأكيد الحجز، وهو غير قابل للاسترداد.'),
    bi('Cancellation requests must be submitted in writing via Earth Adventure’s WhatsApp, and a cancellation is only valid once confirmed by the company.','يجب تقديم طلبات الإلغاء كتابيًا عبر واتساب شركة Earth Adventure، ولا يُعتمد الإلغاء إلا بعد تأكيد الشركة.'),
    bi('If you cancel 30 days or more before the trip date, Earth Adventure refunds 50% of the amount paid, excluding the deposit.','في حال الإلغاء قبل موعد الرحلة بـ30 يومًا أو أكثر، تسترد شركة Earth Adventure للعميل 50% من المبلغ المدفوع، باستثناء العربون.'),
    bi('If you cancel 29 days or less before the trip date, Earth Adventure retains 100% of the amount paid as a cancellation fee. Alternatively, the customer may provide a replacement person to take their place, subject to the company’s approval and the necessary requirements being met.','في حال الإلغاء قبل موعد الرحلة بـ29 يومًا أو أقل، تحتفظ شركة Earth Adventure بنسبة 100% من المبلغ المدفوع كرسوم إلغاء. ويجوز للعميل، بدلًا من ذلك، توفير شخص بديل يحل محله، وذلك بعد موافقة الشركة واستيفاء المتطلبات اللازمة.'),
    bi('If you do not arrive at the meeting point or departure location on time, Earth Adventure retains 100% of the amount paid, and the customer is not entitled to claim any refund.','في حال عدم الحضور إلى نقطة التجمع أو موقع المغادرة في الوقت المحدد، تحتفظ شركة Earth Adventure بنسبة 100% من المبلغ المدفوع، ولا يحق للعميل المطالبة بأي استرداد.'),
    bi('No refund is given for any unused service once the trip or tour has started.','لا تُسترد قيمة أي خدمة غير مستخدمة بعد بدء الرحلة أو الجولة.'),
    bi('Failure to pay instalments according to the agreed payment schedule may result in cancellation of the booking, with Earth Adventure retaining the non-refundable amounts in accordance with the approved cancellation terms.','قد يؤدي عدم سداد الدفعات وفق جدول الدفع المتفق عليه إلى إلغاء الحجز، مع احتفاظ شركة Earth Adventure بالمبالغ غير القابلة للاسترداد وفقًا لشروط الإلغاء المعتمدة.'),
  ] as Bilingual[],
  note: bi('Earth Adventure’s cancellation and refund policy is subject to applicable laws and regulations and relevant consumer protection requirements.','تخضع سياسة الإلغاء والاسترداد لدى شركة Earth Adventure للقوانين واللوائح المعمول بها ومتطلبات حماية المستهلك ذات الصلة.'),
};

// Terms & Conditions for international trips (shown on /terms).
export type TermsBlock =
  | {kind:'p'; text:Bilingual}
  | {kind:'sub'; text:Bilingual}
  | {kind:'ul'; items:Bilingual[]};
export type TermsSection = {title:Bilingual; blocks:TermsBlock[]};
const tp = (en:string, ar:string): TermsBlock => ({kind:'p', text:bi(en,ar)});
const tsub = (en:string, ar:string): TermsBlock => ({kind:'sub', text:bi(en,ar)});
const tul = (...items:[string,string][]): TermsBlock => ({kind:'ul', items:items.map(([en,ar])=>bi(en,ar))});
export const shortTripTerms: {title:Bilingual; sections:TermsSection[]} = {
  title: bi('Terms & Conditions for International Trips','شروط وأحكام الرحلات الدولية'),
  sections: [
    {title: bi('Required documents','الوثائق المطلوبة على المشارك'), blocks:[
      tul(
        ['A copy of a passport valid for 6 months.','نسخة من جواز السفر صالحة لمدة 6 أشهر.'],
        ['Participants must be at least 18 years old.','أن يكون المشارك لا يقل عمره عن 18 عامًا.'],
      ),
    ]},
    {title: bi('Booking confirmation','عملية تأكيد الحجز'), blocks:[
      tul(
        ['A deposit of OMR 150 (non-refundable) is paid to secure the booking.','دفع العربون لضمان الحجز - بقيمة 150 ريالًا (غير قابل للاسترجاع).'],
        ['The amount is transferred to the company’s bank account (IBAN).','سيتم تحويل المبلغ إلى حساب الشركة المصرفي (رقم الآيبان).'],
        ['After you agree to the terms above and the trip itinerary, we will send the liability waiver and the payment and cancellation terms.','بعد الموافقة على البنود المذكورة ومسار الرحلة، سنرسل عقد إخلاء المسؤولية وشروط الدفع والإلغاء.'],
      ),
    ]},
    {title: bi('Cancellation policy','سياسة الإلغاء'), blocks:[
      tsub('If you cancel','إذا تم الإلغاء من قبلك'),
      tp('You must send us your cancellation request via WhatsApp. We calculate the refund amount as of the day we receive your cancellation message. The OMR 150 deposit is non-refundable and is separate from cancellation fees. Please see the cancellation rules below for each activity.','يجب عليك إرسال طلب الإلغاء إلينا عبر واتساب، حيث نقوم بحساب مبلغ الاسترداد في اليوم الذي نتلقى فيه رسالة الإلغاء. مبلغ العربون 150 ريالًا غير قابل للاسترداد وهو منفصل عن رسوم الإلغاء، يرجى الاطلاع على قواعد الإلغاء أدناه لكل نشاط.'),
      tp('If you cancel your trip with Earth Adventure due to any circumstances, such as (COVID-19 / “flu-like symptoms” / being late to arrive / a flight delay or cancellation / a death or any emergency), no refund will be given, except under the following conditions only:','إذا قمت بإلغاء رحلتك مع Earth Adventure بسبب أي ظروف مثل (ظهور COVID-19 / “أعراض تشبه أعراض الإنفلونزا” / التأخر عن الحضور / تأخير الطيران أو إلغاؤه / حالة وفاة أو أي ظرف طارئ)، فلن يتم استرداد المبلغ، إلا في حال تطبيق الشروط التالية فقط:'),
      tul(
        ['30 days or more: Earth Adventure refunds you 50% of the amount paid, excluding the deposit.','30 يومًا أو أكثر: تعيد لك Earth Adventure 50% من المبلغ المدفوع بدون العربون.'],
        ['29 days or less: Earth Adventure retains 100% of the amount paid as a cancellation fee, or you may bring a replacement person to take your place.','29 يومًا أو أقل: تحتفظ Earth Adventure بنسبة 100% من المبلغ المدفوع كرسوم إلغاء، أو تقوم بإحضار شخص بديل يحل مكانك.'],
        ['No-show: if you simply do not show up, Earth Adventure retains 100% of the amount paid.','عدم الظهور: إذا لم تظهر ببساطة، فستحتفظ Earth Adventure بنسبة 100% من المبلغ المدفوع.'],
        ['Refunds for unused services while travelling: no amount is refunded for any service not used after the trip starts or during the tour.','استرداد الخدمات غير المستخدمة أثناء السفر: لن يتم استرجاع أي مبلغ مقابل أي خدمة غير مستخدمة بعد بدء الرحلة أو أثناء الجولة.'],
      ),
    ]},
    {title: bi('Credit','رصيد دائن (Credit)'), blocks:[
      tp('Any credit resulting from your cancellation may be applied to any trip Earth Adventure offers in the same country you booked. To clarify, if you cancel a trip in Oman and a credit is granted, that credit can only be used in Oman. Likewise, a credit issued for a trip in any other country cannot be used for a trip in Oman. This credit is non-transferable and cannot be refunded in cash.','قد يتم تطبيق أي رصيد ناتج عن الإلغاء من جانبك على أي رحلة تقدمها Earth Adventure في نفس البلد الذي حجزته. للتوضيح، إذا قمت بإلغاء رحلة في عمان وتم منح رصيد، فلا يمكن استخدام هذا الرصيد إلا في عمان. وبالمثل مع أي دولة، إذا كان لديك رصيد تم إصداره لرحلة في أي بلد، فلا يمكن استخدامه لرحلة في عمان. هذا الرصيد غير قابل للتحويل أو الاسترداد نقدًا.'),
    ]},
    {title: bi('Cancellation by Earth Adventure','الإلغاء بواسطة Earth Adventure'), blocks:[
      tp('Earth Adventure reserves the right to cancel activities, and we will notify you of any such cancellation. In that case, Earth Adventure will offer you alternative arrangements, and if the alternative booking costs less than the original booking, we will refund you the difference. If you do not accept the alternative arrangements, we will refund 100% of the funds paid for that trip, minus any non-refundable costs incurred by Earth Adventure. We will not be liable under any circumstances for any claims you make for additional costs on your part.','تحتفظ Earth Adventure بالحق في إلغاء الأنشطة وسنقوم بإبلاغكم بمثل هذه الإلغاءات. في هذه الحالة، ستقدم لك Earth Adventure ترتيبات بديلة، وإذا كان سعر الحجز البديل أقل قيمة من الحجز الأصلي، فسنقوم برد الفرق إليك. إذا لم تقبل الترتيبات البديلة، فسنقوم برد 100% من الأموال المدفوعة لهذه الرحلة، مخصومًا منها أي تكاليف غير قابلة للاسترداد تكبدتها Earth Adventure، لكننا لن نكون مسؤولين تحت أي ظرف من الظروف عن أي مطالبات تقدمها عن أي تكاليف إضافية من قبلكم.'),
      tp('Earth Adventure is not responsible for any delay, change or cancellation of any activities or experiences due to force majeure. Force majeure means circumstances beyond Earth Adventure’s reasonable control and includes, without limitation, war, the threat of war, riot, civil war, terrorist activity, industrial dispute, illness, industrial or nuclear disasters, airline delays, bad weather, fires and strikes. If Earth Adventure cancels a booking as a result of force majeure or government advice, it will offer you alternative arrangements. If the alternative booking costs less than the original booking, we will refund you the difference. If you do not accept the alternative arrangements, we will issue you a credit note for the full amount paid, minus any non-refundable costs. Earth Adventure will not be responsible for any additional costs on your part.','لن تكون Earth Adventure مسؤولة عن أي تأخير أو تغيير أو إلغاء لأي أنشطة أو تجارب بسبب القوة القاهرة. القوة القاهرة تعني الظروف الخارجة عن السيطرة المعقولة لشركة Earth Adventure وتشمل على سبيل المثال لا الحصر الحرب أو التهديد بالحرب أو الشغب أو الحرب الأهلية أو النشاط الإرهابي أو النزاع الصناعي أو المرض أو الكوارث الصناعية أو النووية أو تأخيرات شركات الطيران أو الظروف الجوية السيئة أو الحرائق والإضرابات. إذا قامت Earth Adventure بإلغاء حجز نتيجة للقوة القاهرة أو نصيحة حكومية، ستقدم لك Earth Adventure ترتيبات بديلة. إذا كان سعر الحجز البديل أقل قيمة من الحجز الأصلي، فسنقوم برد الفرق إليك. إذا لم تقبل الترتيبات البديلة، سنصدر لك إشعارًا دائنًا بكامل الأموال المدفوعة ناقصًا أي تكاليف غير قابلة للاسترداد. لن تكون Earth Adventure مسؤولة عن أي تكاليف إضافية من قبلكم.'),
    ]},
    {title: bi('Cancellation or postponement due to insufficient numbers','إلغاء أو تأجيل الرحلة لعدم اكتمال العدد'), blocks:[
      tp('Earth Adventure reserves the right to cancel or postpone the trip if the required number of participants is not reached, in order to preserve the quality of the experience and organise the trip properly. If the trip is cancelled, the participant will be notified sufficiently before the trip date, and the amount paid will be refunded in full or transferred to another date, according to the participant’s preference.','تحتفظ Earth Adventure بحقها في إلغاء أو تأجيل الرحلة في حال عدم اكتمال العدد المطلوب من المشاركين، وذلك حفاظًا على جودة التجربة وتنظيم الرحلة بالشكل المناسب. وفي حال تم الإلغاء، سيتم إبلاغ المشارك بذلك قبل موعد الرحلة بوقت كافٍ، وسيتم إعادة المبلغ المدفوع بالكامل أو تحويله إلى موعد آخر حسب رغبة المشارك.'),
    ]},
    {title: bi('Changes to the trip','تغييرات في الرحلة'), blocks:[
      tp('Changes may occur due to force majeure, poor road conditions, weather, availability of transport, vehicle breakdowns, or other circumstances beyond Earth Adventure’s control. You accept that such changes may occur.','قد تحدث التغييرات بسبب القوة القاهرة، أو ظروف الطريق السيئة، أو الطقس، أو توفر وسائل النقل، أو أعطال المركبات، أو بسبب ظروف أخرى خارجة عن سيطرة Earth Adventure. أنت تقبل أن مثل هذه التغييرات قد تحدث.'),
      tp('When changes occur, we will, where practical, inform you of them. Earth Adventure accepts no liability for loss of enjoyment, delay or compensation resulting from changes due to force majeure or any reasons beyond Earth Adventure’s control.','عند حدوث التغييرات، سنقوم، حيثما كان ذلك عمليًا، بإبلاغك بهذه التغييرات. لا تتحمل Earth Adventure أي مسؤولية عن فقدان الاستمتاع أو التأخير أو التعويض الناتج عن التغييرات بسبب القوة القاهرة أو أي أسباب خارجة عن سيطرة Earth Adventure.'),
    ]},
    {title: bi('Leader’s authority','موافقة القيادة'), blocks:[
      tp('During all activities, the decision of the Earth Adventure leader, guide or representative is final on all matters likely to affect the safety and wellbeing of the experience or activity. You must at all times strictly comply with the laws, customs, guidelines and drug regulations in all places visited. If you fail to comply with the above, or if you interfere with the wellbeing of the group, the trip leader, guide or company representative reserves the right to ask you to leave the trip or activity immediately, with no right to a refund. Any travel arrangements after that will be at your own expense.','خلال جميع الأنشطة، سيكون قرار قائد Earth Adventure أو المرشد أو الممثل نهائيًا بشأن جميع الأمور التي من المحتمل أن تؤثر على سلامة ورفاهية التجربة أو النشاط. يجب عليك، في جميع الأوقات، الالتزام الصارم بالقوانين أو العادات أو الإرشادات أو لوائح الأدوية في جميع الأماكن التي تمت زيارتها. إذا فشلت في الامتثال لما ورد أعلاه، أو إذا كنت تتدخل في رفاهية المجموعة، فإن قائد الرحلة أو المرشد أو ممثل الشركة يحتفظ بالحق في أن يطلب منك ترك الرحلة أو النشاط على الفور دون أي حق في استرداد الأموال. سيكون أي ترتيب سفر بعد ذلك على نفقتك الخاصة.'),
    ]},
  ],
};
