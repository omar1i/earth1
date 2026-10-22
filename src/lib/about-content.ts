import { bi } from './content';

// Text of the About page (English version / Arabic version).
export const aboutText = {
  company: {
    eyebrow: bi('Who we are', 'من نحن'),
    title: bi('About Earth Adventure Company', 'عن شركة Earth Adventure'),
    paragraphs: [
      bi(
        'Earth Adventure is a company based in Oman, operated by a local team that loves nature and travel. We aim to provide the best quality of service on our trips.',
        'Earth Adventure هي شركة مقرها في عُمان يديرها فريق محلي يعشق الطبيعة والسفر. نهدف إلى تقديم أفضل جودة خدمة في رحلاتنا.',
      ),
      bi(
        'Discover the world with us, visit new countries and learn about their cultures. Our trips are full of enthusiasm and excitement, and you will feel the joy of adventure. Trips can be customized to your requests.',
        'اكتشف العالم معنا، قم بزيارة بلدان جديدة وتعرف على ثقافاتها. رحلاتنا مليئة بالحماس والإثارة. ستشعر بمتعة المغامرة. يمكن تخصيص الرحلات حسب طلباتكم.',
      ),
      bi(
        'Group trips have a minimum of 6 and a maximum of 16 guests, while private trips can be arranged for any group size, even a single traveller. We work with good-quality hotels and arrange comfortable transportation, in a friendly environment where you will meet new friends and won’t have to worry about travelling alone.',
        'الرحلات الجماعية لها حد أدنى 6 عملاء وحد أقصى 16 عميلاً، أما الرحلات الخاصة فيمكن تنظيمها لأي عدد، حتى لشخص واحد. نتعامل مع فنادق ذات جودة عالية ونوفر وسائل نقل مريحة، في أجواء ودية حيث ستتعرف على أصدقاء جدد ولن تقلق بشأن السفر بمفردك.',
      ),
    ],
    facts: [
      { value: bi('Oman', 'عُمان'), label: bi('Local team', 'فريق محلي') },
      { value: bi('1–16', '1–16'), label: bi('Guests per trip', 'عميلاً في كل رحلة') },
      { value: bi('Custom', 'مخصصة'), label: bi('Trips tailored to you', 'رحلات حسب طلبك') },
    ],
  },
  vision: {
    title: bi('Our Vision', 'رؤيتنا'),
    paragraphs: [
      bi(
        'Earth Adventure’s vision is to make you feel the excitement of life adventures in nature, away from our busy modern world and technology. Our vision is to change and modify the concept of travel.',
        'رؤية Earth Adventure هي أن نجعلك تشعر بإثارة مغامرات الحياة في الطبيعة، بعيداً عن عالمنا الحديث المزدحم والتكنولوجيا. رؤيتنا هي تغيير وتعديل مفهوم السفر.',
      ),
      bi(
        'We believe that nature can heal the soul as well as discover one’s true self. We aim to build the skills of leadership, independence, and a team player with a sense of adventure in a collaborative environment.',
        'نحن نؤمن بأن الطبيعة قادرة على شفاء الروح واكتشاف الذات الحقيقية. نحن نهدف إلى بناء مهارات القيادة، والاستقلالية، وروح الفريق مع حس المغامرة في بيئة تعاونية.',
      ),
    ],
  },
  mission: {
    title: bi('Our Mission', 'مهمتنا'),
    paragraphs: [
      bi(
        'We aim to provide the best service of traveling and outdoor activities, along with an exceptional travel experience with a positive impact and a memorable trip.',
        'نهدف إلى تقديم أفضل خدمات السفر والأنشطة الخارجية، مع تجربة سفر استثنائية ذات أثر إيجابي ورحلة لا تُنسى.',
      ),
    ],
  },
  why: {
    eyebrow: bi('Why choose us', 'اختيارك الأفضل'),
    title: bi('Why us?', 'لماذا نحن؟'),
    paragraphs: [
      bi(
        'Earth Adventure trips are small groups. We make sure that the accommodation is clean and of good quality. Transportation from and to the airport is well arranged by the team prior to your trip. We make sure that safety comes first and that you are comfortable throughout the trip.',
        'رحلات Earth Adventure بمجموعات صغيرة. نحرص على أن يكون السكن نظيفاً وذا جودة عالية. يتم ترتيب المواصلات من وإلى المطار بشكل جيد من قبل الفريق قبل رحلتك. نحرص على أن تكون السلامة أولاً وأن تكون مرتاحاً طوال الرحلة.',
      ),
      bi('All deposits and money transfers are guaranteed.', 'جميع العربونات والتحويلات المالية مضمونة.'),
      bi(
        'The Earth Adventure team will provide you with unforgettable trips with great quality and great service. Our team members are confident leaders, leaders who take responsibility and can act in any situation. We ensure that the safety and comfort of our customers come first throughout the trips. Each trip will extend your experience of new activities, of exploring nature more, and of discovering yourself. As the Earth Adventure team, we make sure the customer is satisfied by the end of the trip.',
        'سيوفر لك فريق Earth Adventure رحلات لا تُنسى بجودة عالية وخدمة ممتازة. أعضاء فريقنا هم قادة واثقون، قادة يتحملون المسؤولية ويمكنهم التصرف في جميع المواقف. نحن نضمن أن سلامة عملائنا وراحتهم تأتي في المقام الأول طوال الرحلات. كل رحلة ستوسع خبرتك في تجربة أنشطة جديدة ومن خلال استكشاف الطبيعة أكثر واكتشاف ذاتك. نحن كفريق Earth Adventure نحرص على أن يكون العميل راضياً بنهاية الرحلة.',
      ),
    ],
    points: [
      { icon: 'users', text: bi('Small groups', 'مجموعات صغيرة') },
      { icon: 'bed', text: bi('Clean, good-quality accommodation', 'سكن نظيف وعالي الجودة') },
      { icon: 'plane', text: bi('Airport transfers arranged by the team', 'مواصلات من وإلى المطار بترتيب الفريق') },
      { icon: 'shield', text: bi('Safety comes first', 'السلامة أولاً') },
      { icon: 'wallet', text: bi('Deposits and transfers guaranteed', 'العربونات والتحويلات مضمونة') },
    ],
  },
  gallery: {
    eyebrow: bi('Our journeys', 'رحلاتنا'),
    title: bi('Moments from our trips', 'لحظات من رحلاتنا'),
  },
  founder: {
    eyebrow: bi('Meet the founder', 'تعرّف على المؤسسة'),
    name: bi('Dalal S. AlOmar', 'دلال سامي العمر'),
    role: bi('Founder and CEO', 'المؤسسة والرئيسة التنفيذية'),
    occupation: bi('Full time at Earth Adventure Co.', 'متفرغة في شركة Earth Adventure'),
    tagline: bi('Dreams come true', 'الأحلام تصبح حقيقة'),
    paragraphs: [
      bi(
        'My name is Dalal AlOmar, also nicknamed “Ba7riya”. I’m proud to be a Kuwaiti citizen. I’m the founder of “Earth Adventure”. My life completely changed as I started getting new skills and got to know myself better when I started traveling with groups.',
        'اسمي دلال العمر وألقب أيضاً بـ “بحرية”. فخورة بكوني مواطنة كويتية. أنا مؤسسة “Earth Adventure”. تغيرت حياتي تماماً عندما بدأت باكتساب مهارات جديدة والتعرف على نفسي بشكل أفضل عندما بدأت السفر مع المجموعات.',
      ),
      bi(
        'Fishing is my life. I love it and spend every day doing it. I’m an avid angler and passionate about adventures and outdoor activities, including hiking, fishing, and mountain climbing. Diving has been both a hobby and a way of life for me since 2010, and I am a PADI instructor, so I can share my knowledge with others. I’m also a first-aid trainer, so whenever you need me, I’ll be there for you.',
        'الصيد هو حياتي. أحبه وأقضي كل يوم في ممارسته. أنا صيادة شغوفة وعاشقة للمغامرات والأنشطة الخارجية، بما في ذلك المشي الجبلي، والصيد، وتسلق الجبال. الغوص كان هواية وأسلوب حياة بالنسبة لي منذ عام 2010، وأنا مدربة غوص PADI، لذلك يمكنني مشاركة معرفتي مع الآخرين. أنا أيضاً مدربة إسعافات أولية، لذلك كلما احتجتني، سأكون موجودة من أجلك.',
      ),
      bi(
        'I enjoy meeting people from different cultures around the world. Earth Adventure has helped me expand my social circle, and I’m always happy to welcome new friends into my life. Come along on one of our trips so I can get the chance to meet you!',
        'أستمتع بلقاء أشخاص من ثقافات مختلفة حول العالم. ساعدتني Earth Adventure على توسيع دائرتي الاجتماعية، وأنا سعيدة دائماً للترحيب بأصدقاء جدد في حياتي. انضم إلى إحدى رحلاتنا حتى أتمكن من الحصول على فرصة للتعرف عليك!',
      ),
    ],
  },
};
